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
      element.bind('click', function() {
        $scope.$apply(function(scope) {
          ctrl.$setViewValue(attr.value);
        });
      });

      // This should just be added once, but is added for each radio input now?
      $scope.$watch(attr.ngModel, function(newValue, oldValue) {
        element.parent(".btn-group").find('button').removeClass("active");
        element.parent(".btn-group") //.children()
        .find("button[value='" + newValue + "']").addClass('active');
      });
    }
  };
});

LastFmModule.controller("FormController", function($scope, $http, LastFmService){
  $scope.username = "";
  $scope.period = "overall";
  $scope.numArtists = "1";

  $scope.getResults = function(){
    LastFmService.showSpinner = true;
    LastFmService.showError = false;
    LastFmService.showChart = false;
    LastFmService.username = $scope.username;
    console.log("getResults()");

    postData = {
      "username": $scope.username,
      "period": $scope.period,
      "numArtists": $scope.numArtists
    }
    console.log(postData);

    $http({
      url: '/lastfm/results',
      method: "POST",
      data: postData,
      headers: {'Content-Type': 'application/json'}
    }).success(function (data, status, headers, config) {
      LastFmService.showSpinner = false;
      LastFmService.showChart = true;
      LastFmService.events = data;

      console.log("success");
      console.log(data);
      nv.addGraph(function() {
        //var chart = nv.models.multiBarChart()
        //var chart = nv.models.stackedAreaChart()
        //var chart = nv.models.lineWithFocusChart()
        var chart = nv.models.pieChart()
          //.x(function(d) { return d[0] })
          .x(function(d) { return d.label; })
          //.y(function(d) { return d[1] })
          .y(function(d) { return d.value; })
          //.showControls(false).stacked(true)
          .showLabels(true)
          .labelThreshold(.05)
          .donut(true)
        /*
        chart.xAxis
          .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });
        chart.x2Axis
          .tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });
        chart.yAxis
          .tickFormat(d3.format(',.1f'));
        */
        d3.select('#chart1 svg')
          .datum(data[0].values)
          .transition().duration(500).call(chart)
        //nv.utils.windowResize(chart.update);
        return chart;
      });
    }).error(function (data, status, headers, config) {
      LastFmService.showSpinner = false;
      LastFmService.showError = true;
      console.log("error")
    });
  }
})

LastFmModule.controller("DisplayController", function($scope, $http, LastFmService){
  $scope.LastFmService = LastFmService;
  $scope.showSpinner = LastFmService.showSpinner;
  $scope.showError = LastFmService.showError;
  $scope.showChart = LastFmService.showChart;
  $scope.username = LastFmService.username;
  
  $scope.$watch('LastFmService.showSpinner', function(newVal, oldVal, scope){
    $scope.showSpinner = newVal;
  })
  $scope.$watch('LastFmService.showError', function(newVal, oldVal, scope){
    $scope.showError = newVal;
  })
  $scope.$watch('LastFmService.showChart', function(newVal, oldVal, scope){
    $scope.showChart = newVal;
  })
  $scope.$watch('LastFmService.username', function(newVal, oldVal, scope){
    $scope.username = newVal;
  })
})

//angular.bootstrap(DMCalApp, ["DMCalApp"]);
