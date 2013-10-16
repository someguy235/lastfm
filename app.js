var express = require('express');
var request = require('request');
var _ = require('underscore');
var async = require('async');

var app = express();

app.use(express.static('resources'));
app.use(express.json());
//app.use(express.static('views'));

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
  var topArtistsURL = APIroot +"?method=user.gettopartists&user="+ params.username +"&period="+ params.period +"&api_key="+ APIkey + "&limit="+ params.numArtists +"&format=json"
  var tags = {};
  request(topArtistsURL, function(err, res, body){
    var data = JSON.parse(body),
      topArtistsList = data.topartists.artist,
      artistsPlayed = [],
      tagSum = 0,
      totalPlays = 0
    if( Object.prototype.toString.call( topArtistsList ) !== '[object Array]' ) {
      topArtistsList = new Array(topArtistsList)
    }
    var numArtistsPlayed = topArtistsList.length < params.numArtists ? topArtistsList.length : params.numArtists

    async.eachSeries(topArtistsList, function(artistNode, callback){
      var artistName  = artistNode.name
      artistsPlayed.push(artistName)
      var artistPlays = artistNode.playcount
      totalPlays += parseInt(artistPlays)
      var artistTagsURL = APIroot +"?method=artist.gettoptags&artist="+ artistName +"&api_key="+ APIkey +"&format=json"
      //var artistTagsURL = encodeURIComponent(APIroot +"?method=artist.gettoptags&artist="+ artistName +"&api_key="+ APIkey)
      setTimeout(function(){
        request(artistTagsURL, function(err, res, body){
          var tagData = JSON.parse(body)
          var artistTagCount = 0
          var numTags = tagData.toptags.tag.length < 5 ? tagData.toptags.tag.length : 5
          
          for(var tagIdx = 0; tagIdx < numTags; tagIdx++){
            artistTagCount += parseInt(tagData.toptags.tag[tagIdx].count)
          }
          
          for(var tagIdx=0; tagIdx<numTags; tagIdx++){
            var tagName = tagData.toptags.tag[tagIdx].name.toLowerCase();
            var tagCount = tagData.toptags.tag[tagIdx].count;
            var tagRatio = tagCount/artistTagCount;
            //var newTagRatio = new TagRatio(tagName: tagName, tagRatio: tagRatio, artist: newArtist).save()
            //newArtist.addToTagRatios(newTagRatio)
            var weightedTag = artistPlays * tagRatio
            if(typeof tags[tagName] == 'undefined'){
              tags[tagName] = weightedTag
            }else{
              tags[tagName] = weightedTag + tags[tagName]
            }
          }
          callback();
        })
      }, 1000);
    }, function(err){
      var returnTags = [{
        key: "Tags",
        values: []
      }]
      _.each(tags, function(val, key){
        tags[key] = Math.round(tags[key] / totalPlays * 100 * 100) / 100;
        returnTags[0].values.push({"label": key, "value": tags[key]})
      })
      response.send(returnTags, 200);
      //response.send(tags, 200);
    });
  })
});

app.listen(3000);
console.log("lastfm listening on port 3000");
