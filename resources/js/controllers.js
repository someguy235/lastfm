/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var events, showSpinner = false, showError = false, showChart = false;

var LastFmModule = angular.module('LastFmApp', []);

LastFmModule.factory('LastFmService', function(){
  var service = {
    events: events,
    showSpinner: showSpinner,
    showError: showError,
    errorText: "",
    showChart: showChart
  }
  return service
})

//TODO: what the hell does this do?
function Main($scope){

}

//angular.module('buttonsRadio', []).directive('buttonsRadio', function() {
//var ButtonModule = angular.module('LastFmApp', []).directive('buttonsRadio', function() {
LastFmModule.directive('buttonsRadio', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function($scope, element, attr, ctrl) {
      element.bind('click', function(e) {
        $scope.$apply(function(scope) {
          ctrl.$setViewValue(attr.value);
        });
        e.stopPropagation();
      });

      // This should just be added once, but is added for each radio input now?
      $scope.$watch(attr.ngModel, function(newValue, oldValue) {
        //console.log(newValue);
        element.parent(".btn-group").find('button').removeClass("active");
        element.parent(".btn-group") //.children()
        .find("button[value='" + newValue + "']").addClass('active');
      });
    }
  };
});

LastFmModule.controller("FormController", function($scope, $http, LastFmService){
  $scope.username = "who_am_i";
  $scope.period = "overall";
  $scope.numArtists = "1";

  $scope.getResults = function(){
    LastFmService.showSpinner = true;
    LastFmService.showError = false;
    LastFmService.showChart = false;
    LastFmService.username = $scope.username;
    //console.log("getResults()");

    postData = {
      "username": $scope.username,
      "period": $scope.period,
      "numArtists": $scope.numArtists
    }
    //console.log(postData);

    $http({
      url: '/lastfm/results',
      method: "POST",
      data: postData,
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      LastFmService.showSpinner = false;
      if(data.length > 0){
        LastFmService.showChart = true;
        LastFmService.events = data;

        nv.addGraph(function() {
          var chart = nv.models.pieChart()
            .x(function(d) { return d.label; })
            .y(function(d) { return d.value; })
            .showLabels(true)
            .labelThreshold(.05)
            .donut(true)
          d3.select('#chart1 svg')
            .datum(data[0].values)
            .transition().duration(500).call(chart)
          return chart;
        });

        var nodes = data[0].nodes;
        var links = data[0].links;

var margin = {top: 1, right: 1, bottom: 20, left: 10},
    //width = 960 - margin.left - margin.right,
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatNumber = d3.format(",.0f"),
    format = function(d) { return formatNumber(d) + " plays"; },
    color = d3.scale.category20();

//var svg = d3.select("#chart2").append("svg")
var svg = d3.select("#chart2 svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .size([width, height]);

var path = sankey.link();

//d3.json("energy.json", function(energy) {

  sankey
      .nodes(nodes)
      .links(links)
      .layout(32);

  var link = svg.append("g").selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

  link.append("title")
      .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

  var node = svg.append("g").selectAll(".node")
      .data(nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
    //.call(d3.behavior.drag()
      //.origin(function(d) { return d; })
      //.on("dragstart", function() { this.parentNode.appendChild(this); })
      //.on("drag", dragmove));

  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
      .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
    .append("title")
      .text(function(d) { return d.name + "\n" + format(d.value); });

  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");
/*
  function dragmove(d) {
    d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    link.attr("d", path);
  }
*/
//});



      }else{
        LastFmService.showError = true;
        //LastFmService.errorText = "No artists found in that time range.";
        LastFmService.errorText = "Sorry, something went wrong.";
      }
    }).error(function (data, status, headers, config) {
      LastFmService.showSpinner = false;
      LastFmService.showError = true;
      LastFmService.errorText = "Sorry, something went wrong.";
      //console.log("error")
    });
  }
})

LastFmModule.controller("DisplayController", function($scope, $http, LastFmService){
  $scope.LastFmService = LastFmService;
  $scope.showSpinner = LastFmService.showSpinner;
  $scope.showError = LastFmService.showError;
  $scope.errorText = LastFmService.errorText;
  $scope.showChart = LastFmService.showChart;
  $scope.username = LastFmService.username;
  
  $scope.$watch('LastFmService.showSpinner', function(newVal, oldVal, scope){
    $scope.showSpinner = newVal;
  })
  $scope.$watch('LastFmService.showError', function(newVal, oldVal, scope){
    $scope.showError = newVal;
  })
  $scope.$watch('LastFmService.errorText', function(newVal, oldVal, scope){
    $scope.errorText = newVal;
  })
  $scope.$watch('LastFmService.showChart', function(newVal, oldVal, scope){
    $scope.showChart = newVal;
  })
  $scope.$watch('LastFmService.username', function(newVal, oldVal, scope){
    $scope.username = newVal;
  })
})

//angular.bootstrap(DMCalApp, ["DMCalApp"]);
