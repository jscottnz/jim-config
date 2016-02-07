angular.module('setttingshtml', ['ionic'])

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('index', {
    url: '/',
    templateUrl: 'views/workouts.html',
    controller: 'WorkoutsController'
  });
  $stateProvider.state('workout', {
    url: '/workout',
    templateUrl: 'views/workout.html',
    controller: 'WorkoutController',
    params : { workout : null, workouts: null }
  });
  $stateProvider.state('day', {
    url: '/day',
    templateUrl: 'views/day.html',
    controller: 'DayController',
    params : { day : null, days : null }
  });
  $stateProvider.state('exercise', {
    url: '/exercise',
    templateUrl: 'views/exercise.html',
    controller: 'ExerciseController',
    params : { exercise : null, exercises : null }
  });
  $stateProvider.state('set', {
    url: '/set',
    templateUrl: 'views/set.html',
    controller: 'SetController',
    params : { set : null, sets : null }
  });

  $urlRouterProvider.otherwise("/");
  
})

.run(function($ionicPlatform, $rootScope, dataService) {
  $ionicPlatform.ready(function() {

    if (window.cordova) {
      console.log("hey, cordova is here")
    }

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

  });

  $rootScope.save = dataService.save;

  $rootScope.reorderItem = function(list, $fromIndex, $toIndex) {
    list.splice($toIndex, 0, list.splice($fromIndex, 1)[0]);
  }
})