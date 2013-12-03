var express = require('express');
var request = require('request');
var _ = require('underscore');
var async = require('async');

var dbUrl = "lastfm"
var collections = ["artists"]
var db = require("mongojs").connect(dbUrl, collections)

var app = express();

app.use('/lastfm/resources', express.static(__dirname + '/resources'));
app.use(express.json());

app.set("views", __dirname + "/views");
app.set("view engine", "jade");

app.engine('.jade', require('jade').__express);
//app.engine('.html', require('jade').__express);

app.get('/', function(req, res){
  res.send("that's not a page", 404);
});

app.get('/lastfm', function(req, res){
  res.render("index");
});

app.post('/lastfm/results', function(req, response){
  var session = req.session
  var params = req.body;

  var APIkey = "503475a6b1d2cafdedf2f69ed4f677c3"
  var APIroot = "http://ws.audioscrobbler.com/2.0/"
  var topArtistsURL = APIroot +"?method=user.gettopartists&user="+ encodeURIComponent(params.username) +"&period="+ params.period +"&api_key="+ APIkey + "&limit="+ params.numArtists +"&format=json"
  var tags = {};
  var nodes = [];
  var links = [];

  request(topArtistsURL, function(err, res, body){
    var data = JSON.parse(body),
      artistsPlayed = [],
      tagsPlayed = [],
      totalPlays = 0,
      topArtistsList
    if(typeof data.topartists !== 'undefined'){
      var topArtistsList = data.topartists.artist
    }
    if( Object.prototype.toString.call( topArtistsList ) !== '[object Array]'  && typeof topArtistsList !== 'undefined') {
      topArtistsList = new Array(topArtistsList)
    }
    //var numArtistsPlayed = topArtistsList.length < params.numArtists ? topArtistsList.length : params.numArtists

    if(typeof topArtistsList !== 'undefined'){
      async.eachSeries(topArtistsList, function(artistNode, callback){
        var artistName  = artistNode.name
        artistsPlayed.push(artistName)
        var artistPlays = artistNode.playcount
        totalPlays += parseInt(artistPlays)

        db.artists.find({artist: artistName}, function(err, artist){
          if(err){
            console.log("err: "+ err);
          }else if(!artist.length){
            console.log("artist not found in cache: "+ artistName);
            var artistTagsURL = APIroot +"?method=artist.gettoptags&artist="+ encodeURIComponent(artistName) +"&api_key="+ APIkey +"&format=json"
            setTimeout(function(){
              request(artistTagsURL, function(err, res, body){
                var tagData = JSON.parse(body).toptags.tag
                var numTags = tagData.length < 5 ? tagData.length : 5
                tagData = tagData.splice(0, numTags);
                tags = parseTags(tags, tagData, artistPlays);

                db.artists.save({artist: artistName, tagData: tagData}, function(err, saved){
                  if(err || !saved) console.log("artist not saved: "+ err);
                });
                callback();
              })
            }, 1000);
          }else{
            console.log("artist found in cache: "+ artistName);
            //tags = parseTags(tags, artist[0].tagData, artistPlays);
            var weightedTags = parseTags(tags, artist[0].tagData, artistPlays);
            //console.log(weightedTags);

            _.each(weightedTags, function(val, key){
              if(_.indexOf(tagsPlayed, key) < 0){
                tagsPlayed.push(key);
              }
              
              var link = {
                source: _.indexOf(artistsPlayed, artistName),
                target: _.indexOf(tagsPlayed, key) + topArtistsList.length,
                value: val
              }
              links.push(link)

              if(typeof tags[key] == 'undefined'){
                tags[key] = val
              }else{
                tags[key] = val + tags[key]
              }
            })
            callback();
          }
        });
      }, function(err){
        var returnNodes = [];
        _.each((_.union(artistsPlayed, tagsPlayed)), function(val){
          returnNodes.push({
            name: val
          })
        })
        var returnTags = [{
          key: "Tags",
          values: [],
          nodes: returnNodes,
          links: links
        }]
        _.each(tags, function(val, key){
          tags[key] = Math.round(tags[key] / totalPlays * 100 * 100) / 100;
          returnTags[0].values.push({"label": key, "value": tags[key]})
        })
        response.send(returnTags, 200);
      });
    }else{
      response.send([], 200);
    }
  })
});

function parseTags(tags, tagData, artistPlays){
  var artistTagCount = 0
  var parsedTags = {};
  for(var tagIdx = 0; tagIdx<tagData.length; tagIdx++){
    artistTagCount += parseInt(tagData[tagIdx].count)
  }
  for(var tagIdx=0; tagIdx<tagData.length; tagIdx++){
    var tagName = tagData[tagIdx].name.toLowerCase();
    var tagCount = tagData[tagIdx].count;
    var tagRatio = tagCount/artistTagCount;
    var weightedTag = artistPlays * tagRatio
    parsedTags[tagName] = weightedTag;
    /*
    if(typeof tags[tagName] == 'undefined'){
      tags[tagName] = weightedTag
    }else{
      tags[tagName] = weightedTag + tags[tagName]
    }
    */
  }
  //return tags
  return parsedTags
}

app.listen(3000);
console.log(new Date() +": lastfm listening on port 3000");

