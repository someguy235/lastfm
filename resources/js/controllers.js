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
  $scope.username = "";
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
