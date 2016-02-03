'use strict';

function removeFromArray(array, value) {
    if (array.indexOf(value)!==-1) {
       array.splice(array.indexOf(value), 1);
       return true;
   } else {
      return false;
   };
}

function goto($rootScope, $state, route, options) {
	if(!$rootScope._routeOptions) {
		$rootScope._routeOptions = {};
	}

	$rootScope._routeOptions[route] = options;
	$state.go(route);	
}

function getRouteData($rootScope, route, $state) {
	if(!$rootScope._routeOptions || !$rootScope._routeOptions[route]) {
		$state.go("index");
		return;
	}
	return $rootScope._routeOptions[route];
}

var app = angular.module('setttingshtml');

app.controller("WorkoutsController", function($rootScope, $scope, $state, $ionicPopup, $ionicListDelegate, dataService, newItemFactory) {

	function addNewWorkout(workout) {
		var workout = { name : workout, days: []}
		dataService.data.workouts.push(workout);
		return workout;
	};

	$scope.showAddNew = function() {
		$ionicPopup.prompt({
			title : 'New workout name'
		}).then(function(workoutName) {
			if (workoutName) {
				addNewWorkout(workoutName);
			}
		});
	};

	$scope.editWorkoutName = function(workout) {
		$ionicPopup.prompt({
			title : 'Rename workout',
			defaultText : workout.name
		}).then(function(workoutName) {
			if (workoutName) {
				workout.name = workoutName;
			}
			$ionicListDelegate.$getByHandle('workouts').closeOptionButtons();
		});
	};

	$scope.viewWorkout = function(workout) {
		$state.go('workout', { workout : workout })
	}

	$scope.deleteWorkout = function(workout) {
		$ionicPopup.confirm({
			title : 'Delete Workout',
			template : 'Are you sure you want to delete this workout?'
		}).then(function(res) {
			if(res) {
				removeFromArray($scope.data.workouts, workout);
			}
			$ionicListDelegate.$getByHandle('workouts').closeOptionButtons();
		});		
	}

	$scope.gotoWorkout = function(options) {
		goto($rootScope, $state, 'workout', options);
	}

	$scope.data = dataService.data;
	
});

app.controller("WorkoutController", function ($rootScope, $scope, $state, $ionicPopup, $ionicListDelegate, dataService) {
	$scope.workout = getRouteData($rootScope, "workout", $state).workout;
	$scope.chooseDay = dataService.chooseDay;
	$scope.dataService = dataService;

	$scope.editDayName = function(day) {
		$ionicPopup.prompt({
			title : 'Rename day',
			defaultText : day.name
		}).then(function(dayName) {
			if (dayName) {
				day.name = dayName;
			}
			$ionicListDelegate.$getByHandle('days').closeOptionButtons();
		});
	};

	function addNewDay(workout, day) {
		workout.days.push({ name : day, exercises : [], isEdit : true});
	};

	$scope.showAddNew = function(workout) {
		$ionicPopup.prompt({
			title : 'New day name'
		}).then(function(dayName) {
			if (dayName) {
				addNewDay(workout, dayName);
			}
		});
	};

	$scope.deleteDay = function(workout, day) {
		$ionicPopup.confirm({
			title : 'Delete Day',
			template : 'Are you sure you want to delete this workout?'
		}).then(function(res) {
			if(res) {
				removeFromArray(workout.days, day);
			}
			$ionicListDelegate.$getByHandle('days').closeOptionButtons();
		});		
	};

	$scope.gotoDay = function(options) {
		goto($rootScope, $state, 'day', options);
	}
});

app.controller("DayController", function ($rootScope, $scope, $state, $ionicPopup, $ionicListDelegate, dataService) {
	$scope.day = getRouteData($rootScope, "day", $state).day;
	$scope.exerciseDb = dataService.exerciseDb;
	$scope.stringLen = dataService.stringLen;
	$scope.chooseDay = dataService.chooseDay;
	$scope.dataService = dataService;

	function addNewExercise(day, exercise, isCircuit) {

		if(typeof exercise === 'string') {
			exercise = {
				name : exercise,
				key : exercise
			}
		}

		var newExercise = { name : exercise.name, sets : [], key : exercise.key }
		if(isCircuit) {
			 newExercise.isCircuit = true;
		}
		day.exercises.push(newExercise);


	};

	$scope.showAddNew = function($event, day) {
		addNewExercise(day, "");
	};

	$scope.cloneExercise = function(day, exercise) {
		var newExercise = angular.copy(exercise);
		exercise.isOpen = false;
		newExercise.isOpen = true;
		day.exercises.push(newExercise);
	}

	$scope.deleteExercise = function(day, exercise) {
		$ionicPopup.confirm({
			title : 'Delete Exercise',
			template : 'Are you sure you want to delete this exercise?'
		}).then(function(res) {
			if(res) {
				removeFromArray(day.exercises, exercise);
			}
			$ionicListDelegate.$getByHandle('exercises').closeOptionButtons();
		});		
	};

	$scope.selectExercise = function(day) {
		$scope.selectedExercise = {};
		$ionicPopup.prompt({
			title : 'Select Exercise',
			templateUrl : 'views/new-exercise-popup.html',
			scope : $scope
		}).then(function(res) {
			addNewExercise(day, $scope.selectedExercise, $scope.selectedExercise.isCircuit);
		});		
	}

	$scope.gotoExercise = function(options) {
		goto($rootScope, $state, 'exercise', options);
	}


});

app.controller("ExerciseController", function ($rootScope, $scope, $state, $ionicPopup, $ionicListDelegate, dataService) {
	$scope.exercise = getRouteData($rootScope, "exercise", $state).exercise;
	$scope.exerciseDb = dataService.exerciseDb;
	$scope.stringLen = dataService.stringLen;

	function addNewSet(exercise, reps, weight, units, rest, circuitExercise) {

		var toAdd = {
			reps : reps,
			wieght : weight,
			units : units,
			rest : rest,
			isCircuit : exercise.isCircuit
		}
		if(exercise.isCircuit) {
			if(typeof circuitExercise === 'string') {
				circuitExercise = {
					name : circuitExercise,
					key : circuitExercise
				}
			}
			toAdd.circuitExercise = circuitExercise;
		}
		exercise.sets.push(toAdd);

	};
	$scope.showAddNew = function($event, exercise) {
		if (exercise.sets.length == 0) {
			addNewSet(exercise, 1, 0, 'lbs', 30, "");	
		} else {
			// clone last
			exercise.sets.push(angular.copy(exercise.sets[exercise.sets.length-1]))
		}
		
	};

	$scope.deleteSet = function(exercise, set) {
		$ionicPopup.confirm({
			title : 'Delete Set',
			template : 'Are you sure you want to delete this set?'
		}).then(function(res) {
			if(res) {
				removeFromArray(exercise.sets, set);
			}
			$ionicListDelegate.$getByHandle('sets').closeOptionButtons();
		});		
	};

	$scope.cloneSet = function(exercise, set) {
		var newSet = angular.copy(set);
		exercise.sets.push(newSet);
		$ionicListDelegate.$getByHandle('sets').closeOptionButtons();
	}

	$scope.gotoSet = function(options) {
		goto($rootScope, $state, 'set', options);
	}

	if($scope.exercise.sets.length === 0) {
		$scope.showAddNew(undefined, $scope.exercise);
		$scope.gotoSet({set:$scope.exercise.sets[0]});
	}
});

app.controller("SetController", function ($rootScope, $scope, $state, $ionicPopup, $ionicListDelegate, dataService) {
	$scope.set = getRouteData($rootScope, "set", $state).set;
	$scope.exercise = getRouteData($rootScope, "set", $state).exercise;
	if(!$scope.set.repsOrTime) {
		$scope.set.repsOrTime = 'reps';
	}

	$scope.exerciseDb = dataService.exerciseDb;
	$scope.stringLen = dataService.stringLen;
	
	$scope.repsRange = [];
	for(var i=1;i<100;i++) {
	  $scope.repsRange.push(i);
	}

	$scope.weightRange = [];
	for(var j=0;j<100;j++) {
	  $scope.weightRange.push(j);
	}

	$scope.restRange = [];
	for(var k=0;k<120;k++) {
	  $scope.restRange.push(k);
	}

	$scope.secondsRange = [];
	for(var s=1;s<300;s++) {
	  $scope.secondsRange.push(s);
	}

	$scope.minutesRange = [];
	for(var s=1;s<7200;s++) {
		if( s % 60 == 0 ) {
			$scope.minutesRange.push(s);
		}
	}

	$scope.renderTime = function(seconds) {
		var minutes = Math.floor(seconds / 60);
		var seconds = seconds - minutes * 60;
		if(seconds < 10) {
			seconds = "0" + seconds;
		}
		return minutes + ":" + seconds;
	}

	$scope.renderHoursMinutes = function(seconds) {
		var hours = Math.floor(seconds / 3600)
		var minutes = Math.floor((seconds - (hours * 3600)) / 60);
		if(minutes < 10) {
			minutes = "0" + minutes;
		}
		return hours + ":" + minutes;
	}

	$scope.selectCircuitExercise = function(set) {
		$scope.selectedExercise = set.circuitExercise;
		$scope.hideCircuit = true;
		$ionicPopup.prompt({
			title : 'Select Exercise',
			templateUrl : 'views/new-exercise-popup.html',
			scope : $scope
		}).then(function(res) {
			set.circuitExercise = $scope.selectedExercise;
			$ionicListDelegate.$getByHandle('setExercise').closeOptionButtons();
		});		
	}
});

app.service("dataService", function() {
	var self = this;

	self.stringLen = function(item) {
		return item.name.length;
	};

	self.load = function() {
		var data = JSON.parse(localStorage.getItem('data')) || {
			chosenDay : 'Shoulders Day',
		    workouts : [
		      {
		        name : 'Example Workout',
		        days : [
		          {
		            name : 'Shoulders Day',
		            exercises : [
		              {
		                name : 'Standing Dumbbell Shoulder Press',
		                sets : [
		                  {
		                    reps : 12,
		                    wieght : 20,
		                    units : 'lbs',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  },
		                  {
		                    reps : 10,
		                    wieght : 20,
		                    units : 'lbs',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  },
		                  {
		                    reps : 8,
		                    wieght : 25,
		                    units : 'lbs',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  }
		                ]
		              },{
		                name : 'Dumbbell Side Lateral Raises',
		                sets : [
		                  {
		                    reps : 12,
		                    wieght : 10,
		                    units : 'lbs',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  },
		                  {
		                    reps : 10,
		                    wieght : 15,
		                    units : 'lbs',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  },
		                  {
		                    reps : 8,
		                    wieght : 15,
		                    units : 'lbs',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  }
		                ]
		              },{
		                name : 'Bench Dips',
		                sets : [
		                  {
		                    reps : 10,
		                    wieght : 0,
		                    units : 'bodyweight',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  },
		                  {
		                    reps : 10,
		                    wieght : 0,
		                    units : 'bodyweight',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  },
		                  {
		                    reps : 10,
		                    wieght : 0,
		                    units : 'bodyweight',
		                    rest : 30,
		                    repsOrTime : 'reps',
		                    timeSecondsOrMinutes : 'seconds'
		                  }
		                ]
		              },
		            ]
		          }
		        ]
		      }
		    ]
		};
		self.data = data;

		for (var i = data.workouts.length - 1; i >= 0; i--) {
			for (var j = data.workouts[i].days.length - 1; j >= 0; j--) {
				if(data.workouts[i].days[j].name === data.chosenDay) {
					self.chooseDay(data.workouts[i].days[j]);
				}
			};
			
		};
	}

	self.chooseDay = function(day) {
		self.chosenDay = day;
		self.data.chosenDay = day.name;
	}

	function getQueryParam(variable, defaultValue) {
		// Find all URL parameters
		var query = location.search.substring(1);
		var vars = query.split('&');
		for (var i = 0; i < vars.length; i++) {
	    	var pair = vars[i].split('=');

		    // If the query variable parameter is found, decode it to use and return it for use
	    	if (pair[0] === variable) {
				return decodeURIComponent(pair[1]);
	    	}
	  	}
	  	return defaultValue || false;
	}

	self.save = function() {
		var data = JSON.stringify(angular.copy(self.data));
		console.log(data);
		localStorage.setItem('data', data);

		if (window.cordova && window.cordova.plugins.Pebble) {



		} else {
			var returnTo = getQueryParam('return_to', 'pebblejs://close#');
			if(returnTo) {

				var toSend = {
			    	workouts : [ {
				        name : 'Default Workout',
				        days : [ self.chosenDay ]
				    }]
				};
				
				document.location = returnTo + encodeURIComponent(JSON.stringify(angular.copy(toSend)));
			}
		}
		
	};


	self.load();	
	self.exerciseDb = [{name : "3/4 Sit-Up", key : "34-sit-up"},
			{name : "90/90 Hamstring", key : "9090-hamstring"},
			{name : "Ab Crunch Machine", key : "ab-crunch-machine"},
			{name : "Ab Pull-In", key : "exercise-ball-pull-in"},
			{name : "Ab Roll-out", key : "ab-roller"},
			{name : "Ab Roller", key : "ab-roller"},
			{name : "Ab Roll Out", key : "ab-roller"},
			{name : "Ab Rollout", key : "ab-roller"},
			{name : "Ab Wheel Rollout", key : "ab-roller"},
			{name : "Adductor", key : "adductor"},
			{name : "Adductor/Groin", key : "adductorgroin-"},
			{name : "Adductor PNF Stretch", key : "adductorgroin-"},
			{name : "Adductor Stretch", key : "adductorgroin-"},
			{name : "Advanced Kettlebell Windmill", key : "advanced-kettlebell-windmill"},
			{name : "Air Bike", key : "air-bike"},
			{name : "air squat", key : "bodyweight-squat"},
			{name : "Air Squats", key : "sit-squats"},
			{name : "All Fours Quad Stretch", key : "all-fours-quad-stretch"},
			{name : "Alternate Hammer Curl", key : "alternate-hammer-curl"},
			{name : "Alternate Heel Touchers", key : "alternate-heel-touchers"},
			{name : "Alternate Incline Dumbbell Curl", key : "alternate-incline-dumbbell-curl"},
			{name : "Alternate Leg Diagonal Bound", key : "alternate-leg-diagonal-bound"},
			{name : "Alternating Bent Over Row", key : "alternating-kettlebell-row"},
			{name : "Alternating Cable Shoulder Press", key : "alternating-cable-shoulder-press"},
			{name : "Alternating Deltoid Raise", key : "alternating-deltoid-raise"},
			{name : "Alternating Dumbbell Curl", key : "zottman-curl"},
			{name : "Alternating Floor Press", key : "alternating-floor-press"},
			{name : "Alternating Front Raise", key : "front-dumbbell-raise"},
			{name : "Alternating Hammer Curl", key : "alternate-hammer-curl"},
			{name : "Alternating Hang Clean", key : "alternating-hang-clean"},
			{name : "Alternating Incline Bicep Curl", key : "alternate-incline-dumbbell-curl"},
			{name : "Alternating Incline Dumbbell Curl", key : "alternate-incline-dumbbell-curl"},
			{name : "Alternating Kettlebell Clean", key : "alternating-hang-clean"},
			{name : "Alternating Kettlebell Floor Press", key : "alternating-floor-press"},
			{name : "Alternating Kettlebell Hang Clean", key : "alternating-hang-clean"},
			{name : "Alternating Kettlebell Press", key : "alternating-kettlebell-press"},
			{name : "Alternating Kettlebell Row", key : "alternating-kettlebell-row"},
			{name : "Alternating Preacher Curl", key : "zottman-preacher-curl"},
			{name : "Alternating Renegade Row", key : "alternating-renegade-row"},
			{name : "Alternating Shoulder Press", key : "bradfordrocky-presses"},
			{name : "Ankle Circles", key : "ankle-circles"},
			{name : "Ankle On The Knee", key : "ankle-on-the-knee"},
			{name : "Anterior Tibialis-SMR", key : "anterior-tibialis-smr"},
			{name : "Anti-Gravity Press", key : "anti-gravity-press"},
			{name : "Arm Circles", key : "arm-circles"},
			{name : "Arnold Dumbbell Press", key : "arnold-dumbbell-press"},
			{name : "Around The Worlds", key : "around-the-worlds"},
			{name : "Atlas Stones", key : "atlas-stones"},
			{name : "Atlas Stone Trainer", key : "atlas-stone-trainer"},
			{name : "Axle Clean And Press", key : "axle-clean-and-press"},
			{name : "Axle Deadlift", key : "axle-deadlift"},
			{name : "back flies", key : "back-flyes-with-bands"},
			{name : "Back Flyes - With Bands", key : "back-flyes-with-bands"},
			{name : "Back Stretch", key : "cat-stretch"},
			{name : "Backward Drag", key : "backward-drag"},
			{name : "Backward Medicine Ball Throw", key : "backward-medicine-ball-throw"},
			{name : "backward sled drag", key : "backward-drag"},
			{name : "Balance Board", key : "balance-board"},
			{name : "Ball Leg Curl", key : "ball-leg-curl"},
			{name : "Band-Assisted Step-Up", key : "single-leg-high-box-squat"},
			{name : "Band Assisted Pull-Up", key : "band-assisted-pull-up"},
			{name : "Band Cross Over", key : "cross-over-with-bands"},
			{name : "Band Deadlift", key : "deadlift-with-bands"},
			{name : "Band Good Morning", key : "band-good-morning"},
			{name : "Band Good Morning (Pull Through)", key : "band-good-morning-pull-through"},
			{name : "Band Hip Adductions", key : "band-hip-adductions"},
			{name : "Band Pull Apart", key : "band-pull-apart"},
			{name : "Band Skull Crusher", key : "band-skull-crusher"},
			{name : "Band Walk", key : "monster-walk"},
			{name : "Barbell Ab Rollout", key : "barbell-ab-rollout"},
			{name : "Barbell Ab Rollout - On Knees", key : "barbell-ab-rollout-on-knees"},
			{name : "Barbell Bench Press", key : "barbell-bench-press-medium-grip"},
			{name : "Barbell Bench Press - Medium Grip", key : "barbell-bench-press-medium-grip"},
			{name : "Barbell Bench Press-Wide Grip", key : "barbell-bench-press-wide-grip"},
			{name : "Barbell Curl", key : "barbell-curl"},
			{name : "Barbell Curls Lying Against An Incline", key : "barbell-curls-lying-against-an-incline"},
			{name : "Barbell Deadlift", key : "barbell-deadlift"},
			{name : "Barbell Full Squat", key : "barbell-full-squat"},
			{name : "Barbell Glute Bridge", key : "barbell-glute-bridge"},
			{name : "Barbell Guillotine Bench Press", key : "barbell-guillotine-bench-press"},
			{name : "Barbell Hack Squat", key : "barbell-hack-squat"},
			{name : "Barbell Hip Thrust", key : "barbell-hip-thrust"},
			{name : "Barbell Incline Bench Press - Medium Grip", key : "barbell-incline-bench-press-medium-grip"},
			{name : "Barbell Incline Bench Press Medium-Grip", key : "barbell-incline-bench-press-medium-grip"},
			{name : "Barbell Incline Shoulder Raise", key : "barbell-incline-shoulder-raise"},
			{name : "Barbell Levers", key : "single-arm-linear-jammer"},
			{name : "Barbell Lunge", key : "barbell-lunge"},
			{name : "Barbell Rear Delt Row", key : "barbell-rear-delt-row"},
			{name : "Barbell Rollout from Bench", key : "barbell-rollout-from-bench"},
			{name : "Barbell Row", key : "bent-over-barbell-row"},
			{name : "Barbell Seated Calf Raise", key : "barbell-seated-calf-raise"},
			{name : "Barbell Shoulder Press", key : "barbell-shoulder-press"},
			{name : "Barbell Shrug", key : "barbell-shrug"},
			{name : "Barbell Shrug Behind The Back", key : "barbell-shrug-behind-the-back"},
			{name : "Barbell Side Bend", key : "barbell-side-bend"},
			{name : "Barbell Side Bends", key : "barbell-side-bend"},
			{name : "Barbell Side Lunge", key : "barbell-side-split-squat"},
			{name : "Barbell Side Split Squat", key : "barbell-side-split-squat"},
			{name : "Barbell Squat", key : "barbell-squat"},
			{name : "Barbell Squat To A Bench", key : "barbell-squat-to-a-bench"},
			{name : "Barbell Squat to a Box", key : "barbell-squat-to-a-bench"},
			{name : "Barbell Step-Ups", key : "barbell-step-ups"},
			{name : "Barbell Step Ups", key : "barbell-step-ups"},
			{name : "Barbell Stiff-Legged Deadlifts", key : "stiff-legged-barbell-deadlift"},
			{name : "Barbell Walking Lunge", key : "barbell-walking-lunge"},
			{name : "Battling Ropes", key : "battling-ropes"},
			{name : "Bear Crawl Sled Drags", key : "bear-crawl-sled-drags-"},
			{name : "Behind Head Chest Stretch", key : "behind-head-chest-stretch"},
			{name : "Behind Neck Press", key : "standing-barbell-press-behind-neck"},
			{name : "Belt Squat", key : "weighted-squat"},
			{name : "Bench Dips", key : "bench-dips"},
			{name : "Bench Jump", key : "bench-jump"},
			{name : "Bench Press", key : "bench-press-powerlifting"},
			{name : "Bench Press - Powerlifting", key : "bench-press-powerlifting"},
			{name : "Bench Press - With Bands", key : "bench-press-with-bands"},
			{name : "Bench Press With Bands", key : "bench-press-with-bands"},
			{name : "Bench Press with Chains", key : "bench-press-with-chains"},
			{name : "Bench Press With Short Bands", key : "bench-press-with-short-bands"},
			{name : "Bench Sprint", key : "bench-sprint"},
			{name : "Bent-Arm Barbell Pullover", key : "bent-arm-barbell-pullover"},
			{name : "Bent-Arm Dumbbell Pullover", key : "bent-arm-dumbbell-pullover"},
			{name : "Bent-Knee Hip Raise", key : "bent-knee-hip-raise"},
			{name : "Bent-Over Dumbbell Rear Delt Raise With Head On Bench", key : "bent-over-dumbbell-rear-delt-raise-with-head-on-bench"},
			{name : "bent-over dumbbell row", key : "bent-over-two-dumbbell-row"},
			{name : "Bent-Over One Arm T-Bar Row", key : "bent-over-one-arm-long-bar-row"},
			{name : "Bent-Over Row", key : "bent-over-barbell-row"},
			{name : "bent-over row", key : "bent-over-two-dumbbell-row-with-palms-in"},
			{name : "Bent Over Barbell Row", key : "bent-over-barbell-row"},
			{name : "Bent Over Dumbbell Rear Delt Raise With Head On Bench", key : "bent-over-dumbbell-rear-delt-raise-with-head-on-bench"},
			{name : "Bent Over Low-Pulley Side Lateral", key : "bent-over-low-pulley-side-lateral"},
			{name : "Bent Over One-Arm Long Bar Row", key : "bent-over-one-arm-long-bar-row"},
			{name : "bent over row", key : "bent-over-two-dumbbell-row"},
			{name : "Bent Over Row", key : "bent-over-barbell-row"},
			{name : "Bent Over Two-Arm Long Bar Row", key : "bent-over-two-arm-long-bar-row"},
			{name : "Bent Over Two-Dumbbell Row", key : "bent-over-two-dumbbell-row"},
			{name : "Bent Over Two-Dumbbell Row With Palms In", key : "bent-over-two-dumbbell-row-with-palms-in"},
			{name : "Bent Press", key : "bent-press"},
			{name : "Bicep Foam Roll", key : "brachialis-smr"},
			{name : "Biceps Curl", key : "standing-inner-biceps-curl"},
			{name : "Biceps Stretch", key : "seated-biceps"},
			{name : "Bicycle Crunches", key : "air-bike"},
			{name : "Bicycling", key : "bicycling"},
			{name : "Bicycling, Stationary", key : "bicycling-stationary"},
			{name : "Blast Straps Fallout", key : "suspended-fallout"},
			{name : "Board Press", key : "board-press"},
			{name : "Body-Up", key : "body-up"},
			{name : "Body Tricep Press", key : "body-tricep-press"},
			{name : "Bodyweight Flyes", key : "bodyweight-flyes"},
			{name : "Bodyweight Mid Row", key : "bodyweight-mid-row"},
			{name : "Bodyweight Reverse Lunge", key : "bodyweight-reverse-lunge"},
			{name : "Bodyweight Squat", key : "bodyweight-squat"},
			{name : "Bodyweight Walking Lunge", key : "bodyweight-walking-lunge"},
			{name : "Bosu Ball Cable Crunch With Side Bends", key : "bosu-ball-cable-crunch-with-side-bends"},
			{name : "Bosu Ball Squat", key : "bosu-ball-squat"},
			{name : "Bottoms-Up Clean From The Hang Position", key : "bottoms-up-clean-from-the-hang-position"},
			{name : "Bottoms Up", key : "bottoms-up"},
			{name : "Bottoms Up Bench Press", key : "pin-presses"},
			{name : "Bottoms Up Good Morning", key : "good-morning-off-pins"},
			{name : "Box Jump (Multiple Response)", key : "box-jump-multiple-response"},
			{name : "Box Skip", key : "box-skip"},
			{name : "Box Squat", key : "box-squat"},
			{name : "Box Squat with Bands", key : "box-squat-with-bands"},
			{name : "Box Squat with Chains", key : "box-squat-with-chains"},
			{name : "Brachialis-SMR", key : "brachialis-smr"},
			{name : "Bradford/Rocky Presses", key : "bradfordrocky-presses"},
			{name : "Bradford Press", key : "bradfordrocky-presses"},
			{name : "Bridge", key : "barbell-hip-thrust"},
			{name : "broomstick stretch", key : "chest-and-front-of-shoulder-stretch"},
			{name : "Bulgarian Split Squat", key : "one-leg-barbell-squat"},
			{name : "Burpee", key : "burpee"},
			{name : "Butt-Ups", key : "butt-ups"},
			{name : "Butterfly", key : "butterfly"},
			{name : "Butt Kicks", key : "butt-kicks"},
			{name : "Butt Lift (Bridge)", key : "butt-lift-bridge"},
			{name : "Cable Chest Press", key : "cable-chest-press"},
			{name : "Cable Crossover", key : "cable-crossover"},
			{name : "Cable Crunch", key : "cable-crunch"},
			{name : "Cable Deadlifts", key : "cable-deadlifts"},
			{name : "Cable Hammer Curls - Rope Attachment", key : "cable-hammer-curls-rope-attachment"},
			{name : "Cable Hip Adduction", key : "cable-hip-adduction"},
			{name : "Cable Hip Extension", key : "one-legged-cable-kickback"},
			{name : "Cable Incline Pushdown", key : "cable-incline-pushdown"},
			{name : "Cable Incline Triceps Extension", key : "cable-incline-triceps-extension"},
			{name : "Cable Internal Rotation", key : "cable-internal-rotation"},
			{name : "Cable Iron Cross", key : "cable-iron-cross"},
			{name : "Cable Judo Flip", key : "cable-judo-flip"},
			{name : "Cable Lateral Raise", key : "standing-low-pulley-deltoid-raise"},
			{name : "Cable Lying Triceps Extension", key : "cable-lying-triceps-extension"},
			{name : "Cable One Arm Tricep Extension", key : "cable-one-arm-tricep-extension"},
			{name : "Cable Preacher Curl", key : "cable-preacher-curl"},
			{name : "Cable Pullover", key : "straight-arm-pulldown"},
			{name : "Cable Rear Delt Fly", key : "cable-rear-delt-fly"},
			{name : "Cable Reverse Crunch", key : "cable-reverse-crunch"},
			{name : "Cable Rope Overhead Triceps Extension", key : "cable-rope-overhead-triceps-extension"},
			{name : "Cable Rope Rear-Delt Rows", key : "cable-rope-rear-delt-rows"},
			{name : "Cable Row", key : "seated-cable-rows"},
			{name : "Cable Rows", key : "seated-cable-rows"},
			{name : "Cable Russian Twists", key : "cable-russian-twists"},
			{name : "Cable Scott Curl", key : "cable-preacher-curl"},
			{name : "Cable Seated Crunch", key : "cable-seated-crunch"},
			{name : "Cable Seated Lateral Raise", key : "cable-seated-lateral-raise"},
			{name : "Cable Shoulder Press", key : "cable-shoulder-press"},
			{name : "Cable Shrugs", key : "cable-shrugs"},
			{name : "Cable Tuck Reverse Crunch", key : "cable-tuck-reverse-crunch"},
			{name : "Cable Wrist Curl", key : "cable-wrist-curl"},
			{name : "Calf-Machine Shoulder Shrug", key : "calf-machine-shoulder-shrug"},
			{name : "Calf Press", key : "calf-press"},
			{name : "Calf Press On The Leg Press Machine", key : "calf-press-on-the-leg-press-machine"},
			{name : "Calf Raise On A Dumbbell", key : "calf-raise-on-a-dumbbell"},
			{name : "Calf Raises - With Bands", key : "calf-raises-with-bands"},
			{name : "Calf Raises Performed on Leg Press Machine", key : "calf-press-on-the-leg-press-machine"},
			{name : "Calf Stretch", key : "standing-soleus-and-achilles-stretch"},
			{name : "Calf Stretch Elbows Against Wall", key : "calf-stretch-elbows-against-wall"},
			{name : "Calf Stretch Hands Against Wall", key : "calf-stretch-hands-against-wall"},
			{name : "Calves-SMR", key : "calves-smr"},
			{name : "Car Deadlift", key : "car-deadlift"},
			{name : "Car Drivers", key : "car-drivers"},
			{name : "Carioca Quick Step", key : "carioca-quick-step"},
			{name : "Catch and Overhead Throw", key : "catch-and-overhead-throw"},
			{name : "Cat Stretch", key : "cat-stretch"},
			{name : "Chain Deadlift", key : "deadlift-with-chains"},
			{name : "Chain Handle Extension", key : "chain-handle-extension"},
			{name : "Chain Press", key : "chain-press"},
			{name : "Chair Leg Extended Stretch", key : "chair-leg-extended-stretch"},
			{name : "Chair Lower Back Stretch", key : "chair-lower-back-stretch"},
			{name : "Chair Squat", key : "chair-squat"},
			{name : "Chair Upper Body Stretch", key : "chair-upper-body-stretch"},
			{name : "Chest-supported Dumbbell Row", key : "dumbbell-incline-row"},
			{name : "Chest-supported Row", key : "one-arm-dumbbell-row"},
			{name : "Chest And Front Of Shoulder Stretch", key : "chest-and-front-of-shoulder-stretch"},
			{name : "Chest Dips", key : "dips-chest-version"},
			{name : "Chest Press", key : "machine-bench-press"},
			{name : "Chest Push (multiple response)", key : "chest-push-multiple-response"},
			{name : "Chest Push (single response)", key : "chest-push-single-response"},
			{name : "Chest Push from 3 point stance", key : "chest-push-from-3-point-stance"},
			{name : "Chest Push with Run Release", key : "chest-push-with-run-release"},
			{name : "Chest Stretch on Stability Ball", key : "chest-stretch-on-stability-ball"},
			{name : "Chest Supported Row", key : "lying-t-bar-row"},
			{name : "Child's Pose", key : "childs-pose"},
			{name : "Chin-Up", key : "chin-up"},
			{name : "Chin To Chest Stretch", key : "chin-to-chest-stretch"},
			{name : "Chinup", key : "chin-up"},
			{name : "Chin Up", key : "chin-up"},
			{name : "Circus Bell", key : "circus-bell"},
			{name : "Clam", key : "clam"},
			{name : "Clavicular Bench Press", key : "neck-press"},
			{name : "Clean", key : "clean"},
			{name : "Clean-grip Deadlift", key : "clean-deadlift"},
			{name : "Clean and Jerk", key : "clean-and-jerk"},
			{name : "Clean and Press", key : "clean-and-press"},
			{name : "Clean Deadlift", key : "clean-deadlift"},
			{name : "Clean from Blocks", key : "clean-from-blocks"},
			{name : "Clean from Boxes", key : "clean-from-blocks"},
			{name : "Clean High Pull", key : "clean-pull-"},
			{name : "Clean Pull", key : "clean-pull-"},
			{name : "Clean Shrug", key : "clean-shrug"},
			{name : "Clock Push-Up", key : "clock-push-up"},
			{name : "Close-Grip Barbell Bench Press", key : "close-grip-barbell-bench-press"},
			{name : "Close-Grip Bench Press with Dumbbell", key : "close-grip-dumbbell-press"},
			{name : "Close-Grip Dumbbell Press", key : "close-grip-dumbbell-press"},
			{name : "Close-Grip EZ-Bar Curl with Band", key : "close-grip-ez-bar-curl-with-band"},
			{name : "Close-Grip EZ-Bar Press", key : "close-grip-ez-bar-press"},
			{name : "Close-Grip EZ Bar Curl", key : "close-grip-ez-bar-curl"},
			{name : "Close-Grip Front Lat Pulldown", key : "close-grip-front-lat-pulldown"},
			{name : "Close-Grip Push-Up off of a Dumbbell", key : "close-grip-push-up-off-of-a-dumbbell"},
			{name : "Close-Grip Standing Barbell Curl", key : "close-grip-standing-barbell-curl"},
			{name : "Close Grip Bench", key : "close-grip-barbell-bench-press"},
			{name : "Cobra Triceps Extension", key : "cobra-triceps-extension"},
			{name : "Cocoons", key : "cocoons"},
			{name : "Commando Row", key : "alternating-renegade-row"},
			{name : "Conan's Wheel", key : "conans-wheel"},
			{name : "Conans", key : "conans-wheel"},
			{name : "Concentration Curl", key : "seated-close-grip-concentration-barbell-curl"},
			{name : "Concentration Curls", key : "concentration-curls"},
			{name : "Cross-Body Back Stretch", key : "dancers-stretch"},
			{name : "Cross-Body Crunch", key : "cross-body-crunch"},
			{name : "Cross-Pulley Pulldown", key : "full-range-of-motion-lat-pulldown"},
			{name : "Cross Body Hammer Curl", key : "cross-body-hammer-curl"},
			{name : "Cross Crunch", key : "cross-crunch"},
			{name : "Cross Over - With Bands", key : "cross-over-with-bands"},
			{name : "Crossover Reverse Lunge", key : "crossover-reverse-lunge"},
			{name : "Crucifix", key : "crucifix"},
			{name : "Crunch - Hands Overhead", key : "crunch-hands-overhead"},
			{name : "Crunch - Legs On Exercise Ball", key : "crunch-legs-on-exercise-ball"},
			{name : "Crunches", key : "crunches"},
			{name : "Crunches on Exercise Ball", key : "crunch-legs-on-exercise-ball"},
			{name : "Cuban Press", key : "cuban-press"},
			{name : "Dancer's Stretch", key : "dancers-stretch"},
			{name : "Dead Bug", key : "dead-bug"},
			{name : "Deadlift Apparatus", key : "car-deadlift"},
			{name : "Deadlift from a Deficit", key : "deficit-deadlift"},
			{name : "Deadlift with Bands", key : "deadlift-with-bands"},
			{name : "Deadlift with Chains", key : "deadlift-with-chains"},
			{name : "Decline Barbell Bench Press", key : "decline-barbell-bench-press"},
			{name : "Decline Close-Grip Bench To Skull Crusher", key : "decline-close-grip-bench-to-skull-crusher"},
			{name : "Decline Crunch", key : "decline-crunch"},
			{name : "Decline Dumbbell Bench Press", key : "decline-dumbbell-bench-press"},
			{name : "Decline Dumbbell Flyes", key : "decline-dumbbell-flyes"},
			{name : "Decline Dumbbell Skullcrusher", key : "decline-dumbbell-triceps-extension"},
			{name : "Decline Dumbbell Triceps Extension", key : "decline-dumbbell-triceps-extension"},
			{name : "Decline EZ Bar Triceps Extension", key : "decline-ez-bar-triceps-extension"},
			{name : "Decline Oblique Crunch", key : "decline-oblique-crunch"},
			{name : "Decline Push-Up", key : "decline-push-up"},
			{name : "Decline Reverse Crunch", key : "decline-reverse-crunch"},
			{name : "Decline Smith Press", key : "decline-smith-press"},
			{name : "Defensive Slide", key : "defensive-slide"},
			{name : "Deficit Deadlift", key : "deficit-deadlift"},
			{name : "Depth Jump Leap", key : "depth-jump-leap"},
			{name : "Dip Machine", key : "dip-machine"},
			{name : "Dips - Chest Version", key : "dips-chest-version"},
			{name : "Dips - Triceps Version", key : "dips-triceps-version"},
			{name : "Dip Squat", key : "jerk-dip-squat"},
			{name : "Donkey Calf Raises", key : "donkey-calf-raises"},
			{name : "Double Kettlebell Alternating Hang Clean", key : "double-kettlebell-alternating-hang-clean"},
			{name : "Double Kettlebell Jerk", key : "double-kettlebell-jerk"},
			{name : "Double Kettlebell Push Press", key : "double-kettlebell-push-press"},
			{name : "Double Kettlebell Snatch", key : "double-kettlebell-snatch"},
			{name : "Double Kettlebell Split Jerk", key : "double-kettlebell-jerk"},
			{name : "Double Kettlebell Windmill", key : "double-kettlebell-windmill"},
			{name : "Double Leg Butt Kick", key : "double-leg-butt-kick"},
			{name : "Downward Facing Balance", key : "downward-facing-balance"},
			{name : "Drag Curl", key : "drag-curl"},
			{name : "Drop Push", key : "drop-push"},
			{name : "Drop Snatch", key : "heaving-snatch-balance"},
			{name : "Dumbbell Alternate Bicep Curl", key : "dumbbell-alternate-bicep-curl"},
			{name : "Dumbbell Bench Press", key : "dumbbell-bench-press"},
			{name : "Dumbbell Bench Press with Neutral Grip", key : "dumbbell-bench-press-with-neutral-grip"},
			{name : "Dumbbell Bicep Curl", key : "dumbbell-bicep-curl"},
			{name : "Dumbbell Clean", key : "dumbbell-clean"},
			{name : "Dumbbell Curl", key : "standing-inner-biceps-curl"},
			{name : "Dumbbell Curls", key : "dumbbell-bicep-curl"},
			{name : "Dumbbell Curl with Neutral Grip", key : "alternate-hammer-curl"},
			{name : "Dumbbell Floor Press", key : "dumbbell-floor-press"},
			{name : "Dumbbell Flyes", key : "dumbbell-flyes"},
			{name : "Dumbbell Incline Row", key : "dumbbell-incline-row"},
			{name : "Dumbbell Incline Shoulder Raise", key : "dumbbell-incline-shoulder-raise"},
			{name : "Dumbbell Kickbacks", key : "tricep-dumbbell-kickback"},
			{name : "Dumbbell Lateral Raise", key : "power-partials"},
			{name : "Dumbbell Lunges", key : "dumbbell-lunges"},
			{name : "Dumbbell Lying One-Arm Rear Lateral Raise", key : "dumbbell-lying-one-arm-rear-lateral-raise"},
			{name : "Dumbbell Lying Pronation", key : "dumbbell-lying-pronation"},
			{name : "Dumbbell Lying Rear Lateral Raise", key : "dumbbell-lying-rear-lateral-raise"},
			{name : "Dumbbell Lying Supination", key : "dumbbell-lying-supination"},
			{name : "Dumbbell One-Arm Shoulder Press", key : "dumbbell-one-arm-shoulder-press"},
			{name : "Dumbbell One-Arm Triceps Extension", key : "dumbbell-one-arm-triceps-extension"},
			{name : "Dumbbell One-Arm Upright Row", key : "dumbbell-one-arm-upright-row"},
			{name : "Dumbbell Power Clean", key : "dumbbell-clean"},
			{name : "Dumbbell Prone Incline Curl", key : "dumbbell-prone-incline-curl"},
			{name : "Dumbbell Raise", key : "dumbbell-raise"},
			{name : "Dumbbell Rear Delt Raise", key : "dumbbell-lying-one-arm-rear-lateral-raise"},
			{name : "Dumbbell Rear Lunge", key : "dumbbell-rear-lunge"},
			{name : "Dumbbell Reverse Fly", key : "dumbbell-lying-one-arm-rear-lateral-raise"},
			{name : "dumbbell row", key : "bent-over-two-dumbbell-row"},
			{name : "Dumbbell Row", key : "one-arm-dumbbell-row"},
			{name : "Dumbbell Scaption", key : "dumbbell-scaption"},
			{name : "Dumbbell Seated Box Jump", key : "dumbbell-seated-box-jump"},
			{name : "Dumbbell Seated Calf Raise", key : "dumbbell-seated-one-leg-calf-raise"},
			{name : "Dumbbell Seated One-Leg Calf Raise", key : "dumbbell-seated-one-leg-calf-raise"},
			{name : "Dumbbell Shoulder Press", key : "dumbbell-shoulder-press"},
			{name : "Dumbbell Shrug", key : "dumbbell-shrug"},
			{name : "Dumbbell Side Bend", key : "dumbbell-side-bend"},
			{name : "Dumbbell Skull Crusher", key : "dumbbell-tricep-extension-pronated-grip"},
			{name : "Dumbbell Squat", key : "dumbbell-squat"},
			{name : "Dumbbell Squat To A Bench", key : "dumbbell-squat-to-a-bench"},
			{name : "Dumbbell Step Ups", key : "dumbbell-step-ups"},
			{name : "Dumbbell Stiff Legged Dead lifts", key : "stiff-legged-dumbbell-deadlift"},
			{name : "Dumbbell Swing", key : "vertical-swing"},
			{name : "Dumbbell Tricep Extension -Pronated Grip", key : "dumbbell-tricep-extension-pronated-grip"},
			{name : "Dumbbell Upright Row", key : "dumbbell-raise"},
			{name : "Dynamic Back Stretch", key : "dynamic-back-stretch"},
			{name : "Dynamic Chest Stretch", key : "dynamic-chest-stretch"},
			{name : "Dynamic hamstring stretch", key : "9090-hamstring"},
			{name : "E-Z Curls", key : "ez-bar-curl"},
			{name : "Elbow Circles", key : "elbow-circles"},
			{name : "Elbows-out Barbell Press", key : "neck-press"},
			{name : "Elbows Back", key : "elbows-back"},
			{name : "Elbows Out Barbell Row", key : "barbell-rear-delt-row"},
			{name : "Elbow to Knee", key : "elbow-to-knee"},
			{name : "Elevated Back Lunge", key : "elevated-back-lunge"},
			{name : "Elevated Cable Rows", key : "elevated-cable-rows"},
			{name : "Elliptical Trainer", key : "elliptical-trainer"},
			{name : "Exercise Ball Crunch", key : "exercise-ball-crunch"},
			{name : "Exercise Ball Pull-In", key : "exercise-ball-pull-in"},
			{name : "Extended Range One-Arm Kettlebell Floor Press", key : "extended-range-one-arm-kettlebell-floor-press"},
			{name : "External Rotation", key : "external-rotation"},
			{name : "External Rotation with Band", key : "external-rotation-with-band"},
			{name : "External Rotation with Cable", key : "external-rotation-with-cable"},
			{name : "EZ-Bar Curl", key : "ez-bar-curl"},
			{name : "EZ-Bar Skullcrusher", key : "ez-bar-skullcrusher"},
			{name : "EZ Bar Decline Skullcrusher", key : "decline-ez-bar-triceps-extension"},
			{name : "Face Pull", key : "face-pull"},
			{name : "Farmer's Carry", key : "farmers-walk"},
			{name : "Farmer's Walk", key : "farmers-walk"},
			{name : "Fast Kick With Arm Circles", key : "fast-kick-with-arm-circles"},
			{name : "Fast Skipping", key : "fast-skipping"},
			{name : "Fat Dumbbell Press", key : "circus-bell"},
			{name : "Feet Jack", key : "feet-jack"},
			{name : "Finger Curls", key : "finger-curls"},
			{name : "Fire Hydrant", key : "fire-hydrant"},
			{name : "Flat Bench Cable Flyes", key : "flat-bench-cable-flyes"},
			{name : "Flat Bench Leg Pull-In", key : "flat-bench-leg-pull-in"},
			{name : "Flat Bench Lying Leg Raise", key : "flat-bench-lying-leg-raise"},
			{name : "Flexor Incline Dumbbell Curls", key : "flexor-incline-dumbbell-curls"},
			{name : "Floor Bridge", key : "hip-lift-with-band"},
			{name : "Floor Glute-Ham Raise", key : "floor-glute-ham-raise"},
			{name : "Floor Press", key : "floor-press"},
			{name : "Floor Press with Chains", key : "floor-press-with-chains"},
			{name : "Floor Press with Dumbbells", key : "dumbbell-floor-press"},
			{name : "Flutter Kicks", key : "flutter-kicks"},
			{name : "Foam Roll Calves", key : "calves-smr"},
			{name : "Foam Roll Erector Spinae", key : "lower-back-smr"},
			{name : "Foam Roll Glutes", key : "piriformis-smr"},
			{name : "Foam Roll Hamstrings", key : "hamstring-smr"},
			{name : "Foam Roll Iliotibial Band", key : "iliotibial-tract-smr"},
			{name : "Foam Roll Inner Thigh", key : "adductor"},
			{name : "Foam Roll Peroneals", key : "peroneals-smr"},
			{name : "Foam Roll Piriformis", key : "piriformis-smr"},
			{name : "Foam Roll Quadriceps", key : "quadriceps-smr"},
			{name : "Foam Roll Upper Back", key : "rhomboids-smr"},
			{name : "Foot-SMR", key : "foot-smr"},
			{name : "Football Up-Down", key : "football-up-down"},
			{name : "Forward Drag with Press", key : "forward-drag-with-press"},
			{name : "Frame Carry", key : "rickshaw-carry"},
			{name : "Frame Deadlift", key : "rickshaw-deadlift-"},
			{name : "Frankenstein Squat", key : "frankenstein-squat"},
			{name : "Freehand Jump Squat", key : "freehand-jump-squat"},
			{name : "Freemotion Chest Press", key : "cable-chest-press"},
			{name : "Freemotion Shoulder Press", key : "seated-cable-shoulder-press"},
			{name : "French Press", key : "standing-overhead-barbell-triceps-extension"},
			{name : "Fridge Carry", key : "yoke-walk"},
			{name : "Frog Hops", key : "frog-hops"},
			{name : "Frog Sit-Ups", key : "frog-sit-ups"},
			{name : "Front-loaded Barbell Squat", key : "zercher-squats"},
			{name : "Front-To-Back Squat With Belt", key : "front-to-back-squat-with-belt"},
			{name : "Front and Side Raises", key : "alternating-deltoid-raise"},
			{name : "Front Barbell Squat", key : "front-barbell-squat"},
			{name : "Front Barbell Squat To A Bench", key : "front-barbell-squat-to-a-bench"},
			{name : "Front Bench Jump", key : "bench-jump"},
			{name : "front box jump", key : "box-jump-multiple-response"},
			{name : "Front Box Jump", key : "front-box-jump"},
			{name : "Front Cable Raise", key : "front-cable-raise"},
			{name : "Front Cone Hops (or hurdle hops)", key : "front-cone-hops-or-hurdle-hops"},
			{name : "Front Dumbbell Raise", key : "front-dumbbell-raise"},
			{name : "Front Incline Dumbbell Raise", key : "front-incline-dumbbell-raise"},
			{name : "Front Jump", key : "bench-jump"},
			{name : "Front Leg Raises", key : "front-leg-raises"},
			{name : "Front Plate Raise", key : "front-plate-raise"},
			{name : "Front Raise And Pullover", key : "front-raise-and-pullover"},
			{name : "Front Squat (Clean Grip)", key : "front-squat-clean-grip"},
			{name : "Front Squats", key : "front-barbell-squat"},
			{name : "Front Squats With Two Kettlebells", key : "front-squats-with-two-kettlebells"},
			{name : "Front Two-Dumbbell Raise", key : "front-two-dumbbell-raise"},
			{name : "Full Range-Of-Motion Lat Pulldown", key : "full-range-of-motion-lat-pulldown"},
			{name : "Gironda Sternum Chins", key : "gironda-sternum-chins"},
			{name : "Glute-Ham Raise", key : "natural-glute-ham-raise"},
			{name : "glute bridge", key : "butt-lift-bridge"},
			{name : "Glute Bridge", key : "hip-lift-with-band"},
			{name : "Glute Bridge Hamstring Walkout", key : "glute-bridge-hamstring-walkout"},
			{name : "Glute Ham Raise", key : "glute-ham-raise"},
			{name : "Glute Kickback", key : "glute-kickback"},
			{name : "Glute Stretch", key : "one-knee-to-chest"},
			{name : "Goblet Squat", key : "goblet-squat"},
			{name : "Good Morning", key : "good-morning"},
			{name : "Good Morning off Pins", key : "good-morning-off-pins"},
			{name : "Gorilla Chin", key : "gorilla-chincrunch"},
			{name : "Gorilla Chin/Crunch", key : "gorilla-chincrunch"},
			{name : "Gorilla Crunch", key : "gorilla-chincrunch"},
			{name : "Groin and Back Stretch", key : "groin-and-back-stretch"},
			{name : "Groiners", key : "groiners-"},
			{name : "Groin PNF Stretch", key : "adductorgroin-"},
			{name : "Guillotine Press", key : "neck-press"},
			{name : "Hack Squat", key : "hack-squat"},
			{name : "Hack Squats", key : "hack-squat"},
			{name : "Hammer Curls", key : "hammer-curls"},
			{name : "Hammer Grip Incline DB Bench Press", key : "hammer-grip-incline-db-bench-press"},
			{name : "Hammerstrength Chest Press", key : "leverage-chest-press"},
			{name : "Hammerstrength Decline Chest Press", key : "leverage-decline-chest-press"},
			{name : "Hammerstrength High Row", key : "leverage-high-row"},
			{name : "Hammerstrength Incline Chest Press", key : "leverage-incline-chest-press"},
			{name : "Hammerstrength Iso Row", key : "leverage-iso-row"},
			{name : "Hammerstrength Shoulder Press", key : "leverage-shoulder-press"},
			{name : "Hammerstrength Shrug", key : "leverage-shrug"},
			{name : "Hamstring-SMR", key : "hamstring-smr"},
			{name : "Hamstring Curl", key : "standing-leg-curl"},
			{name : "hamstring curl", key : "ball-leg-curl"},
			{name : "Hamstrings Myofascial Release", key : "hamstring-smr"},
			{name : "Hamstring Stretch", key : "hamstring-stretch"},
			{name : "Hands-Free Front Squat", key : "frankenstein-squat"},
			{name : "Handstand Push-Ups", key : "handstand-push-ups"},
			{name : "Hang Clean", key : "hang-clean"},
			{name : "Hang Clean - Below the Knees", key : "hang-clean-below-the-knees"},
			{name : "Hanging Bar Good Morning", key : "hanging-bar-good-morning"},
			{name : "Hanging Lat Stretch", key : "one-handed-hang"},
			{name : "Hanging Leg Raise", key : "hanging-leg-raise"},
			{name : "Hanging Leg Raises", key : "hanging-leg-raise"},
			{name : "Hanging Oblique Knee Raise", key : "hanging-oblique-knee-raise"},
			{name : "Hanging Pike", key : "hanging-pike"},
			{name : "Hang Power Snatch", key : "power-snatch"},
			{name : "Hang Snatch", key : "hang-snatch"},
			{name : "Hang Snatch - Below Knees", key : "hang-snatch-below-knees"},
			{name : "Heaving Snatch Balance", key : "heaving-snatch-balance"},
			{name : "Heavy Bag Thrust", key : "heavy-bag-thrust"},
			{name : "Hex Bar Deadlift", key : "trap-bar-deadlift"},
			{name : "High Bar Squat", key : "barbell-full-squat"},
			{name : "High Cable Curls", key : "high-cable-curls"},
			{name : "High Cable Fly", key : "cable-rear-delt-fly"},
			{name : "High Knee Jog", key : "high-knee-jog"},
			{name : "Hip-Belt Squat", key : "weighted-squat"},
			{name : "Hip Circles (prone)", key : "hip-circles-prone"},
			{name : "Hip Crossover", key : "hip-crossover"},
			{name : "Hip Extension", key : "downward-facing-balance"},
			{name : "Hip Extension with Bands", key : "hip-extension-with-bands"},
			{name : "Hip Flexion with Band", key : "hip-flexion-with-band"},
			{name : "Hip Lift with Band", key : "hip-lift-with-band"},
			{name : "hip stretch", key : "ankle-on-the-knee"},
			{name : "hip thrust", key : "butt-lift-bridge"},
			{name : "Hip Thrust", key : "hip-lift-with-band"},
			{name : "Horizontal Barbell Pull Up", key : "inverted-row"},
			{name : "Hug A Ball", key : "hug-a-ball"},
			{name : "Hug Knees To Chest", key : "hug-knees-to-chest"},
			{name : "Hurdle Hops", key : "hurdle-hops"},
			{name : "Hyperextensions (Back Extensions)", key : "hyperextensions-back-extensions"},
			{name : "Hyperextensions With No Hyperextension Bench", key : "hyperextensions-with-no-hyperextension-bench"},
			{name : "Iliotibial Tract-SMR", key : "iliotibial-tract-smr"},
			{name : "Inchworm", key : "inchworm"},
			{name : "Incline Barbell Skull Crusher", key : "incline-barbell-triceps-extension"},
			{name : "Incline Barbell Triceps Extension", key : "incline-barbell-triceps-extension"},
			{name : "Incline Bench Flyes", key : "incline-dumbbell-flyes"},
			{name : "Incline Bench Press", key : "barbell-incline-bench-press-medium-grip"},
			{name : "Incline Bench Pull", key : "incline-bench-pull"},
			{name : "Incline Cable Chest Press", key : "incline-cable-chest-press"},
			{name : "Incline Cable Elevators", key : "incline-cable-chest-press"},
			{name : "Incline Cable Flye", key : "incline-cable-flye"},
			{name : "Incline Dumbbell Bench With Palms Facing In", key : "incline-dumbbell-bench-with-palms-facing-in"},
			{name : "Incline Dumbbell Curl", key : "incline-dumbbell-curl"},
			{name : "Incline Dumbbell Curls", key : "incline-dumbbell-curl"},
			{name : "Incline Dumbbell Flyes", key : "incline-dumbbell-flyes"},
			{name : "Incline Dumbbell Flyes - With A Twist", key : "incline-dumbbell-flyes-with-a-twist"},
			{name : "Incline Dumbbell Press", key : "incline-dumbbell-press"},
			{name : "Incline Dumbbell Press Reverse-Grip", key : "incline-dumbbell-press-reverse-grip"},
			{name : "Incline Hammer Curls", key : "incline-hammer-curls"},
			{name : "Incline Inner Biceps Curl", key : "incline-inner-biceps-curl"},
			{name : "Incline Push-Up", key : "incline-push-up"},
			{name : "Incline Push-Up Close-Grip", key : "incline-push-up-close-grip"},
			{name : "Incline Push-Up Depth Jump", key : "incline-push-up-depth-jump"},
			{name : "Incline Push-Up Medium", key : "incline-push-up-medium"},
			{name : "Incline Push-Up Reverse Grip", key : "incline-push-up-reverse-grip"},
			{name : "Incline Push-Up Wide", key : "incline-push-up-wide"},
			{name : "Inner Thigh Machine", key : "thigh-adductor"},
			{name : "Intermediate Groin Stretch", key : "intermediate-groin-stretch"},
			{name : "Intermediate Hip Flexor and Quad Stretch", key : "intermediate-hip-flexor-and-quad-stretch"},
			{name : "Internal Rotation with Band", key : "internal-rotation-with-band"},
			{name : "Inverted Leg Press", key : "smith-machine-leg-press"},
			{name : "Inverted Row", key : "inverted-row"},
			{name : "Inverted Row with Straps", key : "inverted-row-with-straps"},
			{name : "Iron Cross", key : "iron-cross"},
			{name : "Iron Crosses (stretch)", key : "iron-crosses-stretch"},
			{name : "Isometric Chest Squeezes", key : "isometric-chest-squeezes"},
			{name : "Isometric Neck Exercise - Front And Back", key : "isometric-neck-exercise-front-and-back"},
			{name : "Isometric Neck Exercise - Sides", key : "isometric-neck-exercise-sides"},
			{name : "Isometric Wipers", key : "isometric-wipers"},
			{name : "IT Band and Glute Stretch", key : "it-band-and-glute-stretch"},
			{name : "Jackknife Sit-Up", key : "jackknife-sit-up"},
			{name : "Janda Sit-Up", key : "janda-sit-up"},
			{name : "Jefferson Squats", key : "jefferson-squats"},
			{name : "Jerk Balance", key : "jerk-balance"},
			{name : "Jerk Dip Squat", key : "jerk-dip-squat"},
			{name : "JM Press", key : "jm-press"},
			{name : "JM Press With Bands", key : "jm-press-with-bands"},
			{name : "Jogging-Treadmill", key : "jogging-treadmill"},
			{name : "Jog In Place", key : "jog-in-place"},
			{name : "Jumping Jacks", key : "jumping-jacks"},
			{name : "Jump Lunge To Feet Jack", key : "jump-lunge-to-feet-jack"},
			{name : "Jump Squat", key : "jump-squat"},
			{name : "Keg Load", key : "keg-load"},
			{name : "Kettlebell Alternating Military Press", key : "alternating-kettlebell-press"},
			{name : "Kettlebell Alternating Row", key : "alternating-kettlebell-row"},
			{name : "Kettlebell Arnold Press", key : "kettlebell-arnold-press-"},
			{name : "Kettlebell Clean", key : "one-arm-kettlebell-clean"},
			{name : "Kettlebell Clean and Jerk", key : "one-arm-kettlebell-clean-and-jerk-"},
			{name : "Kettlebell Dead Clean", key : "kettlebell-dead-clean"},
			{name : "Kettlebell Figure 8", key : "kettlebell-figure-8"},
			{name : "Kettlebell Floor Press", key : "alternating-floor-press"},
			{name : "Kettlebell Front Squat", key : "front-squats-with-two-kettlebells"},
			{name : "Kettlebell Hang Clean", key : "kettlebell-hang-clean"},
			{name : "Kettlebell Jerk", key : "one-arm-kettlebell-jerk"},
			{name : "Kettlebell One-Legged Deadlift", key : "kettlebell-one-legged-deadlift"},
			{name : "Kettlebell One-Legged Squat", key : "kettlebell-pistol-squat"},
			{name : "Kettlebell Overhead Press", key : "one-arm-kettlebell-military-press-to-the-side"},
			{name : "Kettlebell Pass Between The Legs", key : "kettlebell-pass-between-the-legs"},
			{name : "Kettlebell Pirate Ships", key : "kettlebell-pirate-ships"},
			{name : "Kettlebell Pistol Squat", key : "kettlebell-pistol-squat"},
			{name : "Kettlebell Seated Press", key : "kettlebell-seated-press"},
			{name : "Kettlebell Seesaw Press", key : "kettlebell-seesaw-press"},
			{name : "Kettlebell Shoulder Press", key : "alternating-kettlebell-press"},
			{name : "Kettlebell Snatch", key : "one-arm-kettlebell-snatch"},
			{name : "Kettlebell Squat", key : "goblet-squat"},
			{name : "Kettlebell Sumo High Pull", key : "kettlebell-sumo-high-pull"},
			{name : "Kettlebell Swing", key : "one-arm-kettlebell-swings"},
			{name : "Kettlebell Thruster", key : "kettlebell-thruster"},
			{name : "Kettlebell Turkish Get-Up (Lunge style)", key : "kettlebell-turkish-get-up-lunge-style"},
			{name : "Kettlebell Turkish Get-Up (Squat style)", key : "kettlebell-turkish-get-up-squat-style"},
			{name : "Kettlebell Windmill", key : "kettlebell-windmill"},
			{name : "Kipping Muscle Up", key : "kipping-muscle-up"},
			{name : "Knee / Hip Raise On Parallel Bars", key : "kneehip-raise-on-parallel-bars"},
			{name : "Knee/Hip Raise On Parallel Bars", key : "kneehip-raise-on-parallel-bars"},
			{name : "Knee Across The Body", key : "knee-across-the-body"},
			{name : "Knee Circles", key : "knee-circles"},
			{name : "Kneeling Arm Drill", key : "kneeling-arm-drill-"},
			{name : "Kneeling Cable Crunch With Alternating Oblique Twists", key : "kneeling-cable-crunch-with-alternating-oblique-twists"},
			{name : "Kneeling Cable Triceps Extension", key : "kneeling-cable-triceps-extension"},
			{name : "Kneeling Forearm Stretch", key : "kneeling-forearm-stretch"},
			{name : "Kneeling High Pulley Row", key : "kneeling-high-pulley-row"},
			{name : "Kneeling Hip Abduction", key : "fire-hydrant"},
			{name : "Kneeling Hip Flexor", key : "kneeling-hip-flexor"},
			{name : "Kneeling Jump Squat", key : "kneeling-jump-squat"},
			{name : "Kneeling Medicine Ball Throw", key : "chest-push-multiple-response"},
			{name : "Kneeling Oblique Cable Crunch", key : "kneeling-cable-crunch-with-alternating-oblique-twists"},
			{name : "Kneeling Quad Stretch", key : "looking-at-ceiling"},
			{name : "Kneeling Single-Arm High Pulley Row", key : "kneeling-single-arm-high-pulley-row"},
			{name : "Kneeling Squat", key : "kneeling-squat"},
			{name : "Knee Tuck Jump", key : "knee-tuck-jump"},
			{name : "Landmine 180's", key : "landmine-180s"},
			{name : "Landmine Linear Jammer", key : "landmine-linear-jammer"},
			{name : "Landmine Thruster", key : "landmine-linear-jammer"},
			{name : "Lateral Bound", key : "lateral-bound-"},
			{name : "Lateral Box Jump", key : "lateral-box-jump"},
			{name : "Lateral Cone Hops", key : "lateral-cone-hops"},
			{name : "Lateral Raise", key : "one-arm-side-laterals"},
			{name : "Lateral Raise - With Bands", key : "lateral-raise-with-bands"},
			{name : "Lateral Speed Step", key : "lateral-speed-step"},
			{name : "Latissimus Dorsi-SMR", key : "latissimus-dorsi-smr"},
			{name : "Lat Pulldown", key : "wide-grip-lat-pulldown"},
			{name : "Lats-Foam Roll", key : "latissimus-dorsi-smr"},
			{name : "Lat Stretch", key : "one-arm-against-wall"},
			{name : "Leg-Over Floor Press", key : "leg-over-floor-press"},
			{name : "Leg-Up Hamstring Stretch", key : "leg-up-hamstring-stretch"},
			{name : "Leg Curl", key : "natural-glute-ham-raise"},
			{name : "Leg Extension", key : "single-leg-leg-extension"},
			{name : "Leg Extensions", key : "leg-extensions"},
			{name : "Leg Lift", key : "leg-lift"},
			{name : "Leg Press", key : "leg-press"},
			{name : "Leg Presses", key : "leg-press"},
			{name : "Leg Pull-in", key : "seated-leg-tucks"},
			{name : "Leg Pull-In", key : "leg-pull-in"},
			{name : "Levator Myofascial Release", key : "neck-smr"},
			{name : "Leverage Chest Press", key : "leverage-chest-press"},
			{name : "Leverage Deadlift", key : "leverage-deadlift"},
			{name : "Leverage Decline Chest Press", key : "leverage-decline-chest-press"},
			{name : "Leverage High Row", key : "leverage-high-row"},
			{name : "Leverage Incline Chest Press", key : "leverage-incline-chest-press"},
			{name : "Leverage Iso Row", key : "leverage-iso-row"},
			{name : "Leverage Shoulder Press", key : "leverage-shoulder-press"},
			{name : "Leverage Shrug", key : "leverage-shrug"},
			{name : "Leverage Squat", key : "leverage-deadlift"},
			{name : "Linear 3-Part Start Technique", key : "linear-3-part-start-technique"},
			{name : "Linear Acceleration Wall Drill", key : "linear-acceleration-wall-drill"},
			{name : "Linear Depth Jump", key : "linear-depth-jump"},
			{name : "Log Clean And Press", key : "log-lift"},
			{name : "Log Lift", key : "log-lift"},
			{name : "London Bridges", key : "london-bridges"},
			{name : "Looking At Ceiling", key : "looking-at-ceiling"},
			{name : "Low Cable Crossover", key : "low-cable-crossover"},
			{name : "Low Cable Tricep Extension", key : "low-cable-triceps-extension"},
			{name : "Low Cable Triceps Extension", key : "low-cable-triceps-extension"},
			{name : "Lower Back-SMR", key : "lower-back-smr"},
			{name : "Lower Back Curl", key : "lower-back-curl"},
			{name : "Lower Back Myofascial Release", key : "lower-back-smr"},
			{name : "Low Pulley Row To Neck", key : "low-pulley-row-to-neck"},
			{name : "Low Row", key : "seated-cable-rows"},
			{name : "Lunge Jump", key : "scissors-jump"},
			{name : "Lunge Pass Through", key : "lunge-pass-through"},
			{name : "Lunge Sprint", key : "lunge-sprint"},
			{name : "Lying Bent Leg Groin", key : "lying-bent-leg-groin"},
			{name : "Lying Cable Curl", key : "lying-cable-curl"},
			{name : "Lying Cambered Barbell Row", key : "lying-cambered-barbell-row"},
			{name : "Lying Close-Grip Barbell Triceps Extension Behind The Head", key : "lying-close-grip-barbell-triceps-extension-behind-the-head"},
			{name : "Lying Close-Grip Barbell Triceps Press To Chin", key : "lying-close-grip-barbell-triceps-press-to-chin"},
			{name : "Lying Close-Grip Bar Curl On High Pulley", key : "lying-close-grip-bar-curl-on-high-pulley"},
			{name : "Lying Crossover", key : "lying-crossover"},
			{name : "Lying Dumbbell Tricep Extension", key : "lying-dumbbell-tricep-extension"},
			{name : "Lying Face Down Plate Neck Resistance", key : "lying-face-down-plate-neck-resistance"},
			{name : "Lying Face Up Plate Neck Resistance", key : "lying-face-up-plate-neck-resistance"},
			{name : "Lying Glute", key : "lying-glute"},
			{name : "Lying Hamstring", key : "lying-hamstring"},
			{name : "Lying Hamstrings Curl", key : "lying-leg-curls"},
			{name : "Lying High Bench Barbell Curl", key : "lying-high-bench-barbell-curl"},
			{name : "Lying Leg Curls", key : "lying-leg-curls"},
			{name : "Lying Machine Squat", key : "lying-machine-squat"},
			{name : "Lying One-Arm Lateral Raise", key : "lying-one-arm-lateral-raise"},
			{name : "Lying Prone Quadriceps", key : "lying-prone-quadriceps"},
			{name : "Lying Rear Delt Raise", key : "lying-rear-delt-raise"},
			{name : "Lying Supine Dumbbell Curl", key : "lying-supine-dumbbell-curl"},
			{name : "Lying T-Bar Row", key : "lying-t-bar-row"},
			{name : "lying triceps extension", key : "lying-triceps-press"},
			{name : "Lying Triceps Press", key : "lying-triceps-press"},
			{name : "Machine Bench Press", key : "machine-bench-press"},
			{name : "Machine Bicep Curl", key : "machine-bicep-curl"},
			{name : "Machine Biceps Curls", key : "machine-preacher-curls"},
			{name : "Machine Calf Raise", key : "calf-press"},
			{name : "Machine Lateral Raise", key : "machine-lateral-raise"},
			{name : "Machine Preacher Curls", key : "machine-preacher-curls"},
			{name : "Machine Shoulder (Military) Press", key : "machine-shoulder-military-press"},
			{name : "Machine Shoulder Shrug", key : "calf-machine-shoulder-shrug"},
			{name : "Machine Squat", key : "machine-squat"},
			{name : "Machine Triceps Extension", key : "machine-triceps-extension"},
			{name : "Medicine Ball Chest Pass", key : "medicine-ball-chest-pass"},
			{name : "Medicine Ball Full Twist", key : "medicine-ball-full-twist"},
			{name : "Medicine Ball Scoop Throw", key : "medicine-ball-scoop-throw"},
			{name : "Medicine Ball Slam", key : "overhead-slam"},
			{name : "Medicine Ball Throw", key : "catch-and-overhead-throw"},
			{name : "Medicine Ball Throw; Medicine Ball Snap", key : "chest-push-from-3-point-stance"},
			{name : "Medicine Ball Throw with Sprint", key : "chest-push-with-run-release"},
			{name : "Middle Back Shrug", key : "middle-back-shrug"},
			{name : "Middle Back Stretch", key : "middle-back-stretch"},
			{name : "Mixed Grip Chin", key : "mixed-grip-chin"},
			{name : "Mixed Grip Pull-Up", key : "mixed-grip-chin"},
			{name : "Monster Walk", key : "monster-walk"},
			{name : "Mountain Climbers", key : "mountain-climbers"},
			{name : "Moving Claw Series", key : "moving-claw-series-"},
			{name : "Muscle-Up", key : "muscle-up"},
			{name : "Muscle Clean", key : "rack-delivery"},
			{name : "Muscle Snatch", key : "muscle-snatch"},
			{name : "Muscle Up", key : "muscle-up"},
			{name : "Myofascial Release", key : "adductor"},
			{name : "Myofascial Release IT Band", key : "iliotibial-tract-smr"},
			{name : "Myofascial Release on Foot Arch", key : "foot-smr"},
			{name : "Myofascial Release Peroneals", key : "peroneals-smr"},
			{name : "Myofascial Release Piriformis", key : "piriformis-smr"},
			{name : "Myofascial Release Quads", key : "quadriceps-smr"},
			{name : "Myofascial Release Rhomboids", key : "rhomboids-smr"},
			{name : "Narrow Stance Hack Squats", key : "narrow-stance-hack-squats"},
			{name : "Narrow Stance Leg Press", key : "narrow-stance-leg-press"},
			{name : "Narrow Stance Squats", key : "narrow-stance-squats"},
			{name : "Natural Glute Ham Raise", key : "natural-glute-ham-raise"},
			{name : "Neck-SMR", key : "neck-smr"},
			{name : "Neck Bridge Prone", key : "neck-bridge-prone"},
			{name : "Neck Bridge Supine", key : "neck-bridge-supine"},
			{name : "Neck Press", key : "neck-press"},
			{name : "Neck Stretch", key : "chin-to-chest-stretch"},
			{name : "Neutral Grip Bicep Curl", key : "alternate-hammer-curl"},
			{name : "Neutral Grip Biceps Curl", key : "hammer-curls"},
			{name : "neutral grip dumbbell row", key : "bent-over-two-dumbbell-row-with-palms-in"},
			{name : "Neutral Grip Preacher Curl", key : "preacher-hammer-dumbbell-curl"},
			{name : "Neutral Incline Dumbbell Bench Press", key : "incline-dumbbell-bench-with-palms-facing-in"},
			{name : "Neutral Incline Dumbbell Press", key : "hammer-grip-incline-db-bench-press"},
			{name : "Oblique Cable Crunch", key : "oblique-cable-crunch"},
			{name : "Oblique Crunch", key : "weighted-ball-side-bend"},
			{name : "Oblique Crunches", key : "oblique-crunches"},
			{name : "Oblique Crunches - On The Floor", key : "oblique-crunches-on-the-floor"},
			{name : "Olympic Squat", key : "olympic-squat-"},
			{name : "On-Your-Back Quad Stretch", key : "on-your-back-quad-stretch"},
			{name : "One-Arm Chin", key : "one-arm-chin-up"},
			{name : "One-Arm Dumbbell Extension", key : "one-arm-pronated-dumbbell-triceps-extension"},
			{name : "One-Arm Dumbbell Press", key : "one-arm-dumbbell-bench-press"},
			{name : "One-Arm Dumbbell Row", key : "one-arm-dumbbell-row"},
			{name : "One-Arm Flat Bench Dumbbell Flye", key : "one-arm-flat-bench-dumbbell-flye"},
			{name : "One-Arm Floor Press", key : "one-arm-floor-press"},
			{name : "One-Arm High-Pulley Cable Side Bends", key : "one-arm-high-pulley-cable-side-bends-"},
			{name : "One-Arm Incline Lateral Raise", key : "one-arm-incline-lateral-raise"},
			{name : "One-Arm Kettlebell Clean", key : "one-arm-kettlebell-clean"},
			{name : "One-Arm Kettlebell Clean and Jerk", key : "one-arm-kettlebell-clean-and-jerk-"},
			{name : "One-Arm Kettlebell Floor Press", key : "one-arm-kettlebell-floor-press"},
			{name : "One-Arm Kettlebell Jerk", key : "one-arm-kettlebell-jerk"},
			{name : "One-Arm Kettlebell Military Press To The Side", key : "one-arm-kettlebell-military-press-to-the-side"},
			{name : "One-Arm Kettlebell Para Press", key : "one-arm-kettlebell-para-press-"},
			{name : "One-Arm Kettlebell Push Press", key : "one-arm-kettlebell-push-press"},
			{name : "One-Arm Kettlebell Row", key : "one-arm-kettlebell-row"},
			{name : "One-Arm Kettlebell Snatch", key : "one-arm-kettlebell-snatch"},
			{name : "One-Arm Kettlebell Split Jerk", key : "one-arm-kettlebell-split-jerk"},
			{name : "One-Arm Kettlebell Split Snatch", key : "one-arm-kettlebell-split-snatch-"},
			{name : "One-Arm Kettlebell Swings", key : "one-arm-kettlebell-swings"},
			{name : "One-Arm Lat Pulldown", key : "one-arm-lat-pulldown"},
			{name : "One-Arm Long Bar Row", key : "one-arm-long-bar-row"},
			{name : "One-Arm Medicine Ball Slam", key : "one-arm-medicine-ball-slam"},
			{name : "One-Arm Open Palm Kettlebell Clean", key : "one-arm-open-palm-kettlebell-clean-"},
			{name : "One-Arm Overhead Kettlebell Squats", key : "one-arm-overhead-kettlebell-squats"},
			{name : "One-Arm Preacher Curl", key : "one-arm-dumbbell-preacher-curl"},
			{name : "one-arm push-up", key : "single-arm-push-up"},
			{name : "One-Arm Side Deadlift", key : "one-arm-side-deadlift"},
			{name : "One-Arm Side Laterals", key : "one-arm-side-laterals"},
			{name : "One-Arm T-Bar Row", key : "one-arm-long-bar-row"},
			{name : "One-Arm Triceps Extension", key : "one-arm-supinated-dumbbell-triceps-extension"},
			{name : "One-Hand Hang", key : "one-handed-hang"},
			{name : "One-Legged Cable Kickback", key : "one-legged-cable-kickback"},
			{name : "One-Legged Squat", key : "pistol-squat"},
			{name : "One Arm Against Wall", key : "one-arm-against-wall"},
			{name : "One Arm Chin-Up", key : "one-arm-chin-up"},
			{name : "One Arm Dumbbell Bench Press", key : "one-arm-dumbbell-bench-press"},
			{name : "One Arm Dumbbell Preacher Curl", key : "one-arm-dumbbell-preacher-curl"},
			{name : "One Arm Dumbbell Row", key : "one-arm-dumbbell-row"},
			{name : "One Arm Floor Press", key : "one-arm-floor-press"},
			{name : "One Arm Lat Pulldown", key : "one-arm-lat-pulldown"},
			{name : "One Arm Pronated Dumbbell Triceps Extension", key : "one-arm-pronated-dumbbell-triceps-extension"},
			{name : "One Arm Supinated Dumbbell Triceps Extension", key : "one-arm-supinated-dumbbell-triceps-extension"},
			{name : "One Half Locust", key : "one-half-locust"},
			{name : "One Handed Hang", key : "one-handed-hang"},
			{name : "One Knee To Chest", key : "one-knee-to-chest"},
			{name : "One Leg Barbell Squat", key : "one-leg-barbell-squat"},
			{name : "On Your Side Quad Stretch", key : "on-your-side-quad-stretch"},
			{name : "Open Palm Kettlebell Clean", key : "open-palm-kettlebell-clean-"},
			{name : "Otis-Up", key : "otis-up"},
			{name : "Outer Thigh Machine", key : "thigh-abductor"},
			{name : "Overhead Cable Curl", key : "overhead-cable-curl"},
			{name : "Overhead Dumbbell Press", key : "standing-dumbbell-press-"},
			{name : "Overhead Lat", key : "overhead-lat"},
			{name : "Overhead Press", key : "machine-shoulder-military-press"},
			{name : "Overhead Slam", key : "overhead-slam"},
			{name : "Overhead Squat", key : "overhead-squat"},
			{name : "Overhead Stretch", key : "overhead-stretch"},
			{name : "Overhead Triceps", key : "overhead-triceps"},
			{name : "Pallof Press", key : "pallof-press"},
			{name : "Pallof Press ISO", key : "pallof-press"},
			{name : "Pallof Press With Rotation", key : "pallof-press-with-rotation"},
			{name : "Palms-Down Dumbbell Wrist Curl Over A Bench", key : "palms-down-dumbbell-wrist-curl-over-a-bench"},
			{name : "Palms-Down Wrist Curl Over A Bench", key : "palms-down-wrist-curl-over-a-bench"},
			{name : "Palms-Up Barbell Wrist Curl Over A Bench", key : "palms-up-barbell-wrist-curl-over-a-bench"},
			{name : "Palms-Up Dumbbell Wrist Curl Over A Bench", key : "palms-up-dumbbell-wrist-curl-over-a-bench"},
			{name : "Parallel Bar Dip", key : "parallel-bar-dip"},
			{name : "Partial Deadlift", key : "rack-pulls"},
			{name : "Pec Deck", key : "butterfly"},
			{name : "Pec Deck Fly", key : "butterfly"},
			{name : "Pelvic Tilt Into Bridge", key : "pelvic-tilt-into-bridge"},
			{name : "Peroneals-SMR", key : "peroneals-smr"},
			{name : "Peroneals Stretch", key : "peroneals-stretch"},
			{name : "Physioball Hip Bridge", key : "physioball-hip-bridge"},
			{name : "physioball leg curl", key : "ball-leg-curl"},
			{name : "Pin Presses", key : "pin-presses"},
			{name : "Pin Pulls", key : "rack-pulls"},
			{name : "Piriformis-SMR", key : "piriformis-smr"},
			{name : "Piriformis stretch", key : "ankle-on-the-knee"},
			{name : "Pistol Squat", key : "pistol-squat"},
			{name : "Plank", key : "plank"},
			{name : "Plank with Twist", key : "plank-with-twist"},
			{name : "Plate Pinch", key : "plate-pinch"},
			{name : "Plate Row", key : "plate-row"},
			{name : "Plate Twist", key : "plate-twist"},
			{name : "Platform Hamstring Slides", key : "platform-hamstring-slides"},
			{name : "Plie Dumbbell Squat", key : "plie-dumbbell-squat"},
			{name : "Plyo Kettlebell Pushups", key : "plyo-kettlebell-pushups"},
			{name : "Plyometric Push-up", key : "plyo-kettlebell-pushups"},
			{name : "plyometric push-up", key : "drop-push"},
			{name : "Plyo Push-up", key : "plyo-push-up"},
			{name : "PNF Glute Stretch", key : "lying-glute"},
			{name : "PNF Hamstring Stretch", key : "lying-hamstring"},
			{name : "Posterior Tibialis Stretch", key : "posterior-tibialis-stretch"},
			{name : "Power Clean", key : "power-clean"},
			{name : "Power Clean from Blocks", key : "power-clean-from-blocks"},
			{name : "Power Clean from Boxes", key : "power-clean-from-blocks"},
			{name : "Power Jerk", key : "power-jerk-"},
			{name : "Power Partials", key : "power-partials"},
			{name : "Power Snatch", key : "power-snatch"},
			{name : "Power Snatch from Blocks", key : "power-snatch-from-blocks"},
			{name : "Power Snatch from Boxes", key : "power-snatch-from-blocks"},
			{name : "Power Stairs", key : "power-stairs"},
			{name : "Power Stair Trainer", key : "power-stairs"},
			{name : "Preacher Curl", key : "preacher-curl"},
			{name : "Preacher Hammer Dumbbell Curl", key : "preacher-hammer-dumbbell-curl"},
			{name : "Press Sit-Up", key : "press-sit-up"},
			{name : "prisoner squat", key : "bodyweight-squat"},
			{name : "Prisoner Squat Jump", key : "frog-hops"},
			{name : "Pronated Hip Flexor Stretch", key : "all-fours-quad-stretch"},
			{name : "Prone Iso Abs", key : "plank"},
			{name : "Prone Manual Hamstring", key : "prone-manual-hamstring"},
			{name : "Prowler Sprint", key : "prowler-sprint"},
			{name : "Pull-up", key : "weighted-pull-ups"},
			{name : "Pull-Up", key : "pullups"},
			{name : "Pulley Row", key : "seated-cable-rows"},
			{name : "Pull Through", key : "pull-through"},
			{name : "Pullup", key : "wide-grip-rear-pull-up"},
			{name : "Pull Up", key : "pullups"},
			{name : "Pullups", key : "pullups"},
			{name : "Punches", key : "punches"},
			{name : "Push-Up", key : "pushups"},
			{name : "Push-up Position Plank Alternating Row", key : "alternating-renegade-row"},
			{name : "Push-Ups - Close Triceps Position", key : "push-ups-close-triceps-position"},
			{name : "Push-Ups With Feet Elevated", key : "push-ups-with-feet-elevated"},
			{name : "Push-Ups With Feet On An Exercise Ball", key : "push-ups-with-feet-on-an-exercise-ball"},
			{name : "Push-Up Wide", key : "push-up-wide"},
			{name : "Push Jerk", key : "power-jerk-"},
			{name : "Push Press", key : "push-press"},
			{name : "Push Press - Behind the Neck", key : "push-press-behind-the-neck"},
			{name : "push up", key : "single-arm-push-up"},
			{name : "Push Up", key : "pushups"},
			{name : "Pushups", key : "pushups"},
			{name : "Pushups (Close and Wide Hand Positions)", key : "pushups-close-and-wide-hand-positions"},
			{name : "Pushups - Close Triceps Position", key : "push-ups-close-triceps-position"},
			{name : "Push Up to Side Plank", key : "push-up-to-side-plank"},
			{name : "Pyramid", key : "pyramid"},
			{name : "Quadriceps-SMR", key : "quadriceps-smr"},
			{name : "Quad Stretch", key : "quad-stretch"},
			{name : "Quick Leap", key : "quick-leap"},
			{name : "Rack Delivery", key : "rack-delivery"},
			{name : "Rack Pulls", key : "rack-pulls"},
			{name : "Rack Pull with Bands", key : "rack-pull-with-bands"},
			{name : "Rear Delt Cable Fly", key : "cable-seated-lateral-raise"},
			{name : "rear delt cable raise", key : "bent-over-low-pulley-side-lateral"},
			{name : "Rear Delt Cable Row", key : "cable-rope-rear-delt-rows"},
			{name : "rear delt flies", key : "back-flyes-with-bands"},
			{name : "Rear Delt Fly", key : "seated-bent-over-rear-delt-raise"},
			{name : "rear delt fly", key : "back-flyes-with-bands"},
			{name : "Rear Delt Flyes", key : "reverse-flyes-with-external-rotation"},
			{name : "rear delt flyes", key : "back-flyes-with-bands"},
			{name : "Rear Delt Machine Flyes", key : "reverse-machine-flyes"},
			{name : "Rear Delt Raise", key : "dumbbell-lying-rear-lateral-raise"},
			{name : "rear delt raise", key : "bent-over-low-pulley-side-lateral"},
			{name : "Rear Delt Row", key : "cable-rope-rear-delt-rows"},
			{name : "Rear Foot Elevated Split Squat", key : "one-leg-barbell-squat"},
			{name : "Rear Leg Raises", key : "rear-leg-raises"},
			{name : "Recumbent Bike", key : "recumbent-bike"},
			{name : "Renegade Row", key : "alternating-renegade-row"},
			{name : "Return Push from Stance", key : "return-push-from-stance"},
			{name : "Reverse-Grip Bent-Over Row", key : "reverse-grip-bent-over-rows"},
			{name : "Reverse Band Bench Press", key : "reverse-band-bench-press"},
			{name : "Reverse Band Box Squat", key : "reverse-band-box-squat"},
			{name : "Reverse Band Deadlift", key : "reverse-band-deadlift"},
			{name : "Reverse Band Power Squat", key : "reverse-band-power-squat"},
			{name : "Reverse Band Squat", key : "reverse-band-power-squat"},
			{name : "Reverse Band Sumo Deadlift", key : "reverse-band-sumo-deadlift"},
			{name : "Reverse Barbell Curl", key : "reverse-barbell-curl"},
			{name : "Reverse Barbell Preacher Curls", key : "reverse-barbell-preacher-curls"},
			{name : "Reverse Cable Curl", key : "reverse-cable-curl"},
			{name : "Reverse Crunch", key : "reverse-crunch"},
			{name : "reverse crunch", key : "bent-knee-hip-raise"},
			{name : "Reverse Dumbbell Fly", key : "dumbbell-lying-rear-lateral-raise"},
			{name : "Reverse Flyes", key : "reverse-flyes"},
			{name : "Reverse Flyes With External Rotation", key : "reverse-flyes-with-external-rotation"},
			{name : "Reverse Grip Bent-Over Rows", key : "reverse-grip-bent-over-rows"},
			{name : "Reverse Grip Bent Over Row", key : "reverse-grip-bent-over-rows"},
			{name : "Reverse Grip Triceps Pushdown", key : "reverse-grip-triceps-pushdown"},
			{name : "Reverse Hyper", key : "reverse-hyperextension"},
			{name : "Reverse Hyperextension", key : "reverse-hyperextension"},
			{name : "Reverse Machine Flyes", key : "reverse-machine-flyes"},
			{name : "Reverse Plate Curls", key : "reverse-plate-curls"},
			{name : "Reverse Shrug", key : "scapular-pull-up"},
			{name : "Reverse Triceps Bench Press", key : "reverse-triceps-bench-press"},
			{name : "Rhomboids-SMR", key : "rhomboids-smr"},
			{name : "Rickshaw Carry", key : "rickshaw-carry"},
			{name : "Rickshaw Deadlift", key : "rickshaw-deadlift-"},
			{name : "Ring Dips", key : "ring-dips"},
			{name : "Rockers (Pullover To Press) Straight Bar", key : "rockers-pullover-to-press-straight-bar"},
			{name : "Rocket Jump", key : "rocket-jump"},
			{name : "Rocking Standing Calf Raise", key : "rocking-standing-calf-raise"},
			{name : "Rocky Press", key : "bradfordrocky-presses"},
			{name : "Rocky Pull-Ups/Pulldowns", key : "rocky-pull-upspulldowns"},
			{name : "Rollerblading", key : "skating"},
			{name : "Romanian Deadlift", key : "romanian-deadlift"},
			{name : "Romanian Deadlift from Deficit", key : "romanian-deadlift-from-deficit"},
			{name : "Romanian Deadlift with Kettlebell", key : "romanian-deadlift-with-kettlebell"},
			{name : "Rope Climb", key : "rope-climb"},
			{name : "Rope Crunch", key : "rope-crunch"},
			{name : "Rope Jumping", key : "rope-jumping"},
			{name : "Rope Straight-Arm Pulldown", key : "rope-straight-arm-pulldown"},
			{name : "Rope Triceps Extension", key : "cable-rope-overhead-triceps-extension"},
			{name : "rotating shoulder press", key : "arnold-dumbbell-press"},
			{name : "Round The World Shoulder Stretch", key : "round-the-world-shoulder-stretch"},
			{name : "Row from Plank", key : "alternating-renegade-row"},
			{name : "Rowing, Stationary", key : "rowing-stationary"},
			{name : "Runner's Stretch", key : "runners-stretch"},
			{name : "Running, Treadmill", key : "running-treadmill"},
			{name : "Russian Twist", key : "russian-twist"},
			{name : "Sandbag Load", key : "sandbag-load"},
			{name : "Sandbags", key : "sandbag-load"},
			{name : "Scapular Pull-Up", key : "scapular-pull-up"},
			{name : "Scapular Retraction", key : "middle-back-shrug"},
			{name : "Scissor Kick", key : "scissor-kick"},
			{name : "Scissors Jump", key : "scissors-jump"},
			{name : "Seated Back Extension", key : "seated-back-extension"},
			{name : "Seated Band Hamstring Curl", key : "seated-band-hamstring-curl"},
			{name : "Seated Barbell Military Press", key : "seated-barbell-military-press"},
			{name : "Seated Barbell Press", key : "bradfordrocky-presses"},
			{name : "Seated Barbell Shoulder Press", key : "barbell-shoulder-press"},
			{name : "Seated Barbell Twist", key : "seated-barbell-twist"},
			{name : "Seated Bent-Over One-Arm Dumbbell Triceps Extension", key : "seated-bent-over-one-arm-dumbbell-triceps-extension"},
			{name : "Seated Bent-Over Rear Delt Raise", key : "seated-bent-over-rear-delt-raise"},
			{name : "Seated Bent-Over Two-Arm Dumbbell Triceps Extension", key : "seated-bent-over-two-arm-dumbbell-triceps-extension"},
			{name : "Seated Biceps", key : "seated-biceps"},
			{name : "Seated Cable Rear Delt Fly", key : "cable-seated-lateral-raise"},
			{name : "Seated Cable Rows", key : "seated-cable-rows"},
			{name : "Seated Cable Shoulder Press", key : "seated-cable-shoulder-press"},
			{name : "Seated Calf Raise", key : "seated-calf-raise"},
			{name : "Seated Calf Raises", key : "seated-calf-raise"},
			{name : "Seated Calf Stretch", key : "seated-calf-stretch"},
			{name : "Seated Close-Grip Concentration Barbell Curl", key : "seated-close-grip-concentration-barbell-curl"},
			{name : "Seated Dumbbell Curl", key : "seated-dumbbell-curl"},
			{name : "Seated Dumbbell Inner Biceps Curl", key : "seated-dumbbell-inner-biceps-curl"},
			{name : "Seated Dumbbell Palms-Down Wrist Curl", key : "seated-dumbbell-palms-down-wrist-curl"},
			{name : "Seated Dumbbell Palms-Up Wrist Curl", key : "seated-dumbbell-palms-up-wrist-curl"},
			{name : "Seated Dumbbell Press", key : "seated-dumbbell-press"},
			{name : "Seated Flat Bench Leg Pull-In", key : "seated-flat-bench-leg-pull-in"},
			{name : "Seated Floor Hamstring Stretch", key : "seated-floor-hamstring-stretch"},
			{name : "Seated Front Deltoid", key : "seated-front-deltoid"},
			{name : "Seated Glute", key : "seated-glute"},
			{name : "Seated Glute Stretch", key : "seated-glute-stretch"},
			{name : "Seated Good Mornings", key : "seated-good-mornings"},
			{name : "Seated Hamstring", key : "seated-hamstring"},
			{name : "Seated Hamstring and Calf Stretch", key : "seated-hamstring-and-calf-stretch"},
			{name : "Seated Head Harness Neck Resistance", key : "seated-head-harness-neck-resistance"},
			{name : "Seated Leg Curl", key : "seated-leg-curl"},
			{name : "Seated Leg Curls", key : "seated-leg-curl"},
			{name : "Seated Leg Press", key : "seated-leg-press"},
			{name : "Seated Leg Tucks", key : "seated-leg-tucks"},
			{name : "Seated One-arm Cable Pulley Rows", key : "seated-one-arm-cable-pulley-rows"},
			{name : "Seated One-Arm Dumbbell Palms-Down Wrist Curl", key : "seated-one-arm-dumbbell-palms-down-wrist-curl"},
			{name : "Seated One-Arm Dumbbell Palms-Up Wrist Curl", key : "seated-one-arm-dumbbell-palms-up-wrist-curl"},
			{name : "Seated Overhead Stretch", key : "seated-overhead-stretch"},
			{name : "Seated Palm-Up Barbell Wrist Curl", key : "seated-palm-up-barbell-wrist-curl"},
			{name : "Seated Palms-Down Barbell Wrist Curl", key : "seated-palms-down-barbell-wrist-curl"},
			{name : "Seated Scissor Kick", key : "seated-scissor-kick"},
			{name : "Seated Side Lateral Raise", key : "seated-side-lateral-raise"},
			{name : "Seated Triceps Kickback", key : "seated-bent-over-two-arm-dumbbell-triceps-extension"},
			{name : "Seated Triceps Press", key : "seated-triceps-press"},
			{name : "Seated Two-Arm Palms-Up Low-Pulley Wrist Curl", key : "seated-two-arm-palms-up-low-pulley-wrist-curl"},
			{name : "See-Saw Press (Alternating Side Press)", key : "see-saw-press-alternating-side-press"},
			{name : "See Saw Press", key : "see-saw-press-alternating-side-press"},
			{name : "Shotgun Row", key : "shotgun-row"},
			{name : "Shoulder Circles", key : "shoulder-circles"},
			{name : "Shoulder Press", key : "machine-shoulder-military-press"},
			{name : "Shoulder Press - With Bands", key : "shoulder-press-with-bands"},
			{name : "shoulder press with pronation", key : "arnold-dumbbell-press"},
			{name : "shoulder protraction", key : "barbell-incline-shoulder-raise"},
			{name : "Shoulder Raise", key : "shoulder-raise"},
			{name : "Shoulder Stretch", key : "shoulder-stretch"},
			{name : "Shrug on Calf Machine", key : "calf-machine-shoulder-shrug"},
			{name : "Side-Lying Floor Stretch", key : "side-lying-floor-stretch"},
			{name : "Side Bridge", key : "side-bridge"},
			{name : "Side Hop-Sprint", key : "side-hop-sprint"},
			{name : "Side Jackknife", key : "side-jackknife"},
			{name : "Side Lateral Raise", key : "side-lateral-raise"},
			{name : "Side Laterals to Front Raise", key : "side-laterals-to-front-raise-"},
			{name : "Side Leg Raises", key : "side-leg-raises"},
			{name : "Side Lunge", key : "side-lunge"},
			{name : "Side Lying Groin Stretch", key : "side-lying-groin-stretch"},
			{name : "Side Neck Stretch", key : "side-neck-stretch"},
			{name : "Side Standing Long Jump", key : "side-standing-long-jump"},
			{name : "Side to Side Box Shuffle", key : "side-to-side-box-shuffle"},
			{name : "Side To Side Chins", key : "side-to-side-chins"},
			{name : "Side To Side Push-Up", key : "side-to-side-push-up"},
			{name : "Side Wrist Pull", key : "side-wrist-pull"},
			{name : "Single-Arm Cable Crossover", key : "single-arm-cable-crossover"},
			{name : "Single-Arm Dumbbell Press", key : "one-arm-dumbbell-bench-press"},
			{name : "Single-Arm Dumbbell Triceps Extension", key : "one-arm-supinated-dumbbell-triceps-extension"},
			{name : "Single-Arm Floor Press", key : "one-arm-floor-press"},
			{name : "Single-Arm Kettlebell Shoulder Press", key : "one-arm-kettlebell-military-press-to-the-side"},
			{name : "Single-Arm Linear Jammer", key : "single-arm-linear-jammer"},
			{name : "Single-Arm Preacher Curl", key : "one-arm-dumbbell-preacher-curl"},
			{name : "Single-Arm Pulldown", key : "one-arm-lat-pulldown"},
			{name : "Single-Arm Push-Up", key : "single-arm-push-up"},
			{name : "Single-Arm Row", key : "one-arm-dumbbell-row"},
			{name : "Single-Cone Sprint Drill", key : "single-cone-sprint-drill"},
			{name : "Single-leg curl", key : "standing-leg-curl"},
			{name : "Single-Leg Deadlift", key : "kettlebell-one-legged-deadlift"},
			{name : "Single-Leg High Box Squat", key : "single-leg-high-box-squat"},
			{name : "Single-Leg Hop Progression", key : "single-leg-hop-progression"},
			{name : "Single-Leg Lateral Hop", key : "single-leg-lateral-hop"},
			{name : "Single-Leg Leg Extension", key : "single-leg-leg-extension"},
			{name : "Single-Leg Squat", key : "one-leg-barbell-squat"},
			{name : "Single-Leg Stride Jump", key : "single-leg-stride-jump"},
			{name : "Single Arm Dumbbell Press", key : "one-arm-dumbbell-bench-press"},
			{name : "Single Arm Lat Pulldown", key : "one-arm-lat-pulldown"},
			{name : "Single Arm Overhead Kettlebell Squat", key : "single-arm-overhead-kettlebell-squat"},
			{name : "Single Arm Preacher Curl", key : "one-arm-dumbbell-preacher-curl"},
			{name : "Single Arm Row", key : "one-arm-dumbbell-row"},
			{name : "Single Calf Raise", key : "calf-raise-on-a-dumbbell"},
			{name : "Single Dumbbell Press", key : "dumbbell-one-arm-shoulder-press"},
			{name : "Single Dumbbell Raise", key : "single-dumbbell-raise"},
			{name : "Single Leg Butt Kick", key : "single-leg-butt-kick"},
			{name : "Single Leg Deadlift", key : "single-leg-deadlift"},
			{name : "Single Leg Glute Bridge", key : "single-leg-glute-bridge-"},
			{name : "Single Leg Push-off", key : "single-leg-push-off"},
			{name : "Single Neutral-Grip Shoulder Press", key : "standing-palm-in-one-arm-dumbbell-press"},
			{name : "Sit-Up", key : "sit-up"},
			{name : "Sit Squats", key : "sit-squats"},
			{name : "Situp", key : "weighted-sit-ups-with-bands"},
			{name : "Sit Up", key : "weighted-sit-ups-with-bands"},
			{name : "Skating", key : "skating"},
			{name : "Skull Crusher", key : "lying-close-grip-barbell-triceps-extension-behind-the-head"},
			{name : "Skullcrusher", key : "lying-triceps-press"},
			{name : "Sled Drag - Harness", key : "sled-drag-harness"},
			{name : "Sled Drag with Press", key : "forward-drag-with-press"},
			{name : "Sledgehammer Swings", key : "sledgehammer-swings"},
			{name : "Sled Overhead Backward Walk", key : "sled-overhead-backward-walk"},
			{name : "Sled Overhead Triceps Extension", key : "sled-overhead-triceps-extension"},
			{name : "Sled Pull", key : "sled-drag-harness"},
			{name : "Sled Push", key : "sled-push"},
			{name : "Sled Reverse Flye", key : "sled-reverse-flye"},
			{name : "Sled Row", key : "sled-row"},
			{name : "Slide Jump Shot", key : "slide-jump-shot"},
			{name : "Slow Jog", key : "slow-jog"},
			{name : "Smith Incline Shoulder Raise", key : "smith-incline-shoulder-raise"},
			{name : "Smith Machine Behind the Back Shrug", key : "smith-machine-behind-the-back-shrug"},
			{name : "Smith Machine Bench Press", key : "smith-machine-bench-press"},
			{name : "Smith Machine Bent Over Row", key : "smith-machine-bent-over-row"},
			{name : "Smith Machine Calf Raise", key : "smith-machine-calf-raise"},
			{name : "Smith Machine Close-Grip Bench Press", key : "smith-machine-close-grip-bench-press"},
			{name : "Smith Machine Decline Press", key : "smith-machine-decline-press"},
			{name : "Smith Machine Hang Power Clean", key : "smith-machine-hang-power-clean"},
			{name : "Smith Machine Hip Raise", key : "smith-machine-hip-raise"},
			{name : "Smith Machine Incline Bench Press", key : "smith-machine-incline-bench-press"},
			{name : "Smith Machine Incline Chest Press", key : "smith-machine-incline-bench-press"},
			{name : "Smith Machine Leg Press", key : "smith-machine-leg-press"},
			{name : "Smith Machine One-Arm Upright Row", key : "smith-machine-one-arm-upright-row"},
			{name : "Smith Machine Overhead Shoulder Press", key : "smith-machine-overhead-shoulder-press"},
			{name : "Smith Machine Pistol Squat", key : "smith-machine-pistol-squat"},
			{name : "Smith Machine Reverse Calf Raises", key : "smith-machine-reverse-calf-raises"},
			{name : "Smith Machine Shrug", key : "smith-machine-shrug"},
			{name : "Smith Machine Squat", key : "smith-machine-squat"},
			{name : "Smith Machine Stiff-Legged Deadlift", key : "smith-machine-stiff-legged-deadlift"},
			{name : "Smith Machine Upright Row", key : "smith-machine-upright-row"},
			{name : "Smith Single-Leg Split Squat", key : "smith-single-leg-split-squat"},
			{name : "Snatch", key : "snatch"},
			{name : "snatch", key : "one-arm-kettlebell-snatch"},
			{name : "Snatch-Grip Deadlift", key : "snatch-deadlift"},
			{name : "Snatch Balance", key : "snatch-balance-"},
			{name : "Snatch Deadlift", key : "snatch-deadlift"},
			{name : "Snatch from Blocks", key : "snatch-from-blocks"},
			{name : "Snatch from Boxes", key : "snatch-from-blocks"},
			{name : "Snatch High Pull", key : "snatch-pull"},
			{name : "Snatch Pull", key : "snatch-pull"},
			{name : "Snatch Shrug", key : "snatch-shrug"},
			{name : "Speed Band Overhead Triceps", key : "speed-band-overhead-triceps"},
			{name : "Speed Band Pushdown", key : "speed-band-pushdown"},
			{name : "Speed Box Squat", key : "speed-box-squat"},
			{name : "Speed Squats", key : "speed-squats"},
			{name : "Spell Caster", key : "spell-caster"},
			{name : "Spider Crawl", key : "spider-crawl"},
			{name : "Spider Curl", key : "spider-curl"},
			{name : "Spinal Stretch", key : "spinal-stretch"},
			{name : "Split Clean", key : "split-clean"},
			{name : "Split Jerk", key : "split-jerk"},
			{name : "Split Jump", key : "split-jump"},
			{name : "Split Snatch", key : "split-snatch"},
			{name : "Split Squats", key : "split-squats"},
			{name : "Split Squat with Dumbbells", key : "split-squat-with-dumbbells"},
			{name : "Square Hop", key : "square-hop"},
			{name : "Squat", key : "olympic-squat-"},
			{name : "Squat Clean", key : "clean"},
			{name : "Squat Jerk", key : "squat-jerk"},
			{name : "Squats", key : "barbell-squat"},
			{name : "Squats - With Bands", key : "squats-with-bands"},
			{name : "Squat with Bands", key : "squat-with-bands"},
			{name : "Squat with Chains", key : "squat-with-chains"},
			{name : "Squat with Plate Movers", key : "squat-with-plate-movers"},
			{name : "Stability Ball Abdominal Twist", key : "cable-russian-twists"},
			{name : "Stability Ball Hip Bridge", key : "physioball-hip-bridge"},
			{name : "stability ball leg curl", key : "ball-leg-curl"},
			{name : "Stability Ball Pec Stretch", key : "chest-stretch-on-stability-ball"},
			{name : "Staggered Push-Up", key : "staggered-push-up"},
			{name : "Stairmaster", key : "stairmaster"},
			{name : "Standing Alternating Dumbbell Press", key : "standing-alternating-dumbbell-press-"},
			{name : "Standing Barbell Calf Raise", key : "standing-barbell-calf-raise"},
			{name : "Standing Barbell Curl", key : "wide-grip-standing-barbell-curl"},
			{name : "Standing Barbell Press", key : "standing-military-press"},
			{name : "Standing Barbell Press Behind Neck", key : "standing-barbell-press-behind-neck"},
			{name : "Standing Bent-Over One-Arm Dumbbell Triceps Extension", key : "standing-bent-over-one-arm-dumbbell-triceps-extension"},
			{name : "Standing Bent-Over Two-Arm Dumbbell Triceps Extension", key : "standing-bent-over-two-arm-dumbbell-triceps-extension"},
			{name : "Standing Biceps Cable Curl", key : "standing-biceps-cable-curl"},
			{name : "Standing Biceps Stretch", key : "standing-biceps-stretch"},
			{name : "Standing Bradford Press", key : "standing-bradford-press"},
			{name : "Standing Cable Chest Press", key : "standing-cable-chest-press"},
			{name : "Standing Cable Crossovers", key : "cable-crossover"},
			{name : "Standing Cable Lift", key : "standing-cable-lift"},
			{name : "Standing Cable Wood Chop", key : "standing-cable-wood-chop"},
			{name : "Standing Calf Raises", key : "standing-calf-raises"},
			{name : "Standing Concentration Curl", key : "standing-concentration-curl"},
			{name : "Standing Dumbbell Calf Raise", key : "standing-dumbbell-calf-raise"},
			{name : "Standing Dumbbell Press", key : "standing-dumbbell-press-"},
			{name : "Standing Dumbbell Reverse Curl", key : "standing-dumbbell-reverse-curl"},
			{name : "Standing Dumbbell Straight-Arm Front Delt Raise Above Head", key : "standing-dumbbell-straight-arm-front-delt-raise-above-head"},
			{name : "Standing Dumbbell Triceps Extension", key : "standing-dumbbell-triceps-extension"},
			{name : "Standing Dumbbell Upright Row", key : "standing-dumbbell-upright-row"},
			{name : "Standing Elevated Quad Stretch", key : "standing-elevated-quad-stretch"},
			{name : "Standing Front Barbell Raise Over Head", key : "standing-front-barbell-raise-over-head"},
			{name : "Standing Gastrocnemius Calf Stretch", key : "standing-gastrocnemius-calf-stretch"},
			{name : "Standing Hamstring and Calf Stretch", key : "standing-hamstring-and-calf-stretch"},
			{name : "Standing Hamstring Stretch", key : "standing-toe-touches"},
			{name : "Standing Hip Circles", key : "standing-hip-circles"},
			{name : "Standing Hip Flexors", key : "standing-hip-flexors"},
			{name : "Standing Inner-Biceps Curl", key : "standing-inner-biceps-curl"},
			{name : "Standing Kickback", key : "standing-bent-over-two-arm-dumbbell-triceps-extension"},
			{name : "Standing Lateral Stretch", key : "standing-lateral-stretch"},
			{name : "Standing Leg Curl", key : "standing-leg-curl"},
			{name : "Standing Long Jump", key : "standing-long-jump"},
			{name : "Standing Low-Pulley Deltoid Raise", key : "standing-low-pulley-deltoid-raise"},
			{name : "Standing Low-Pulley One-Arm Triceps Extension", key : "standing-low-pulley-one-arm-triceps-extension"},
			{name : "Standing Military Press", key : "standing-military-press"},
			{name : "Standing Olympic Plate Hand Squeeze", key : "standing-olympic-plate-hand-squeeze"},
			{name : "Standing One-Arm Cable Curl", key : "standing-one-arm-cable-curl"},
			{name : "Standing One-Arm Dumbbell Curl Over Incline Bench", key : "standing-one-arm-dumbbell-curl-over-incline-bench"},
			{name : "Standing One-Arm Dumbbell Triceps Extension", key : "standing-one-arm-dumbbell-triceps-extension"},
			{name : "Standing Overhead Barbell Triceps Extension", key : "standing-overhead-barbell-triceps-extension"},
			{name : "Standing Overhead Press", key : "standing-military-press"},
			{name : "Standing Palm-In One-Arm Dumbbell Press", key : "standing-palm-in-one-arm-dumbbell-press"},
			{name : "Standing Palms-In Dumbbell Press", key : "standing-palms-in-dumbbell-press"},
			{name : "Standing Palms-Up Barbell Behind The Back Wrist Curl", key : "standing-palms-up-barbell-behind-the-back-wrist-curl"},
			{name : "Standing Pelvic Tilt", key : "standing-pelvic-tilt"},
			{name : "Standing Rope Crunch", key : "standing-rope-crunch"},
			{name : "Standing Shoulder Press with Cables", key : "cable-shoulder-press"},
			{name : "Standing Soleus And Achilles Stretch", key : "standing-soleus-and-achilles-stretch"},
			{name : "Standing Toe Touches", key : "standing-toe-touches"},
			{name : "Standing Towel Triceps Extension", key : "standing-towel-triceps-extension"},
			{name : "Standing Two-Arm Overhead Throw", key : "standing-two-arm-overhead-throw"},
			{name : "Star Jump", key : "star-jump"},
			{name : "stationary bike", key : "bicycling-stationary"},
			{name : "Stationary Rowing", key : "rowing-stationary"},
			{name : "Step-up with Knee Raise", key : "step-up-with-knee-raise"},
			{name : "Step Mill", key : "step-mill"},
			{name : "Stiff-Legged Barbell Deadlift", key : "stiff-legged-barbell-deadlift"},
			{name : "Stiff-Legged Deadlift", key : "stiff-legged-deadlift"},
			{name : "Stiff-Legged Dumbbell Deadlift", key : "stiff-legged-dumbbell-deadlift"},
			{name : "Stiff Leg Barbell Good Morning", key : "stiff-leg-barbell-good-morning"},
			{name : "Stiff Legged Deadlift - wide", key : "wide-stance-stiff-legs"},
			{name : "Stomach Vacuum", key : "stomach-vacuum"},
			{name : "Straight-Arm Dumbbell Pullover", key : "straight-arm-dumbbell-pullover"},
			{name : "Straight-Arm Pulldown", key : "straight-arm-pulldown"},
			{name : "Straight-Legged Deadlift", key : "romanian-deadlift-from-deficit"},
			{name : "Straight-Legged Hip Raise", key : "straight-legged-hip-raise"},
			{name : "Straight Arm Pull-Up", key : "scapular-pull-up"},
			{name : "Straight Bar Bench Mid Rows", key : "straight-bar-bench-mid-rows"},
			{name : "Straight Raises on Incline Bench", key : "straight-raises-on-incline-bench"},
			{name : "Stride Jump Crossover", key : "stride-jump-crossover"},
			{name : "Suitcase Crunch", key : "suitcase-crunch"},
			{name : "Suitcase Deadlift", key : "one-arm-side-deadlift"},
			{name : "Sumo Deadlift", key : "sumo-deadlift"},
			{name : "Sumo Deadlift with Bands", key : "sumo-deadlift-with-bands"},
			{name : "Sumo Deadlift with Chains", key : "sumo-deadlift-with-chains"},
			{name : "Sumo Dumbbell Squat", key : "plie-dumbbell-squat"},
			{name : "Sumo Squat", key : "wide-stance-barbell-squat"},
			{name : "Sumo Squat Stretch", key : "sumo-squat-stretch"},
			{name : "Sumo Stiff-Legged Deadlift", key : "wide-stance-stiff-legs"},
			{name : "Superman", key : "superman"},
			{name : "Supinating Incline Dumbbell Flyes", key : "incline-dumbbell-flyes-with-a-twist"},
			{name : "Supine Chest Throw", key : "supine-chest-throw"},
			{name : "Supine One-Arm Overhead Throw", key : "supine-one-arm-overhead-throw"},
			{name : "Supine Two-Arm Overhead Throw", key : "supine-two-arm-overhead-throw"},
			{name : "Suspended Abdominal Fallout", key : "suspended-fallout"},
			{name : "Suspended Back Fly", key : "suspended-back-fly"},
			{name : "Suspended Chest Fly", key : "suspended-chest-fly"},
			{name : "Suspended Fallout", key : "suspended-fallout"},
			{name : "Suspended Good Morning", key : "hanging-bar-good-morning"},
			{name : "Suspended Push-Up", key : "suspended-push-up"},
			{name : "Suspended Reverse Crunch", key : "suspended-reverse-crunch"},
			{name : "Suspended Row", key : "suspended-row"},
			{name : "Suspended Split Squat", key : "suspended-split-squat"},
			{name : "Svend Press", key : "svend-press"},
			{name : "T-Bar Row", key : "t-bar-row"},
			{name : "T-Bar Row with Handle", key : "t-bar-row-with-handle"},
			{name : "Tate Press", key : "tate-press"},
			{name : "The Straddle", key : "the-straddle"},
			{name : "Thick Bar Deadlift", key : "axle-deadlift"},
			{name : "Thigh Abductor", key : "thigh-abductor"},
			{name : "Thigh Adductor", key : "thigh-adductor"},
			{name : "Tire Flip", key : "tire-flip"},
			{name : "Toe Press", key : "calf-press"},
			{name : "Toe Touchers", key : "toe-touchers"},
			{name : "Torso Rotation", key : "torso-rotation"},
			{name : "Trail Running/Walking", key : "trail-runningwalking"},
			{name : "Trap Bar Deadlift", key : "trap-bar-deadlift"},
			{name : "Tricep Dip", key : "weighted-bench-dip"},
			{name : "tricep dip", key : "bench-dips"},
			{name : "Tricep Dips", key : "dips-triceps-version"},
			{name : "Tricep Dumbbell Kickback", key : "tricep-dumbbell-kickback"},
			{name : "Tricep Extension with Chains", key : "chain-handle-extension"},
			{name : "Tricep Kickbacks", key : "tricep-dumbbell-kickback"},
			{name : "Tricep Push-down", key : "triceps-pushdown"},
			{name : "Tricep Pushdowns", key : "triceps-pushdown"},
			{name : "Triceps Dip", key : "parallel-bar-dip"},
			{name : "Triceps Dips", key : "dips-triceps-version"},
			{name : "Tricep Side Stretch", key : "tricep-side-stretch"},
			{name : "Triceps Kickback", key : "seated-bent-over-one-arm-dumbbell-triceps-extension"},
			{name : "Triceps Kickbacks", key : "tricep-dumbbell-kickback"},
			{name : "Triceps Overhead Extension with Rope", key : "triceps-overhead-extension-with-rope"},
			{name : "Triceps Press", key : "tate-press"},
			{name : "Triceps Pushdown", key : "triceps-pushdown"},
			{name : "Triceps Pushdown - Rope Attachment", key : "triceps-pushdown-rope-attachment"},
			{name : "Triceps Pushdown - V-Bar Attachment", key : "triceps-pushdown-v-bar-attachment"},
			{name : "Triceps Pushdowns", key : "triceps-pushdown"},
			{name : "Triceps Stretch", key : "triceps-stretch"},
			{name : "TRX Fallout", key : "suspended-fallout"},
			{name : "TRX Row", key : "suspended-row"},
			{name : "Tuck Crunch", key : "tuck-crunch"},
			{name : "Turkish Get Up", key : "kettlebell-turkish-get-up-lunge-style"},
			{name : "Two-Arm Dumbbell Preacher Curl", key : "two-arm-dumbbell-preacher-curl"},
			{name : "Two-Arm Kettlebell Clean", key : "two-arm-kettlebell-clean"},
			{name : "Two-Arm Kettlebell Jerk", key : "two-arm-kettlebell-jerk"},
			{name : "Two-Arm Kettlebell Military Press", key : "two-arm-kettlebell-military-press"},
			{name : "Two-Arm Kettlebell Row", key : "two-arm-kettlebell-row"},
			{name : "Two-Arm Long Bar Row with Handle", key : "t-bar-row-with-handle"},
			{name : "Underhand Cable Pulldowns", key : "underhand-cable-pulldowns"},
			{name : "Upper Back-Leg Grab", key : "upper-back-leg-grab"},
			{name : "Upper Back Stretch", key : "upper-back-stretch"},
			{name : "Upright Barbell Row", key : "upright-barbell-row"},
			{name : "Upright Cable Row", key : "upright-cable-row"},
			{name : "Upright Row - With Bands", key : "upright-row-with-bands"},
			{name : "Upright Rows", key : "upright-barbell-row"},
			{name : "Upward Stretch", key : "upward-stretch"},
			{name : "V-Bar Pulldown", key : "v-bar-pulldown"},
			{name : "V-Bar Pullup", key : "v-bar-pullup"},
			{name : "V-Up", key : "jackknife-sit-up"},
			{name : "Vertical Mountain Climber", key : "vertical-mountain-climber"},
			{name : "Vertical Swing", key : "vertical-swing"},
			{name : "Walking, Treadmill", key : "walking-treadmill"},
			{name : "Walking High Knees", key : "walking-high-knees"},
			{name : "Wave Lengths", key : "battling-ropes"},
			{name : "Weighted Ball Hyperextension", key : "weighted-ball-hyperextension"},
			{name : "Weighted Ball Side Bend", key : "weighted-ball-side-bend"},
			{name : "Weighted Bench Dip", key : "weighted-bench-dip"},
			{name : "Weighted Crunches", key : "weighted-crunches"},
			{name : "weighted hip extension", key : "barbell-hip-thrust"},
			{name : "Weighted Jump Squat", key : "weighted-jump-squat-"},
			{name : "weighted lunges", key : "barbell-lunge"},
			{name : "Weighted Pull Ups", key : "weighted-pull-ups"},
			{name : "weighted scapular protraction", key : "barbell-incline-shoulder-raise"},
			{name : "Weighted Sissy Squat", key : "weighted-sissy-squat"},
			{name : "Weighted Sit-Ups - With Bands", key : "weighted-sit-ups-with-bands"},
			{name : "Weighted Squat", key : "weighted-squat"},
			{name : "Weighted Suitcase Crunch", key : "weighted-suitcase-crunch"},
			{name : "Wheel of Pain", key : "conans-wheel"},
			{name : "Wide-Grip Barbell Bench Press", key : "wide-grip-barbell-bench-press"},
			{name : "Wide-Grip Decline Barbell Bench Press", key : "wide-grip-decline-barbell-bench-press"},
			{name : "Wide-Grip Decline Barbell Pullover", key : "wide-grip-decline-barbell-pullover"},
			{name : "Wide-Grip Lat Pulldown", key : "wide-grip-lat-pulldown"},
			{name : "Wide-Grip Pulldown Behind The Neck", key : "wide-grip-pulldown-behind-the-neck"},
			{name : "Wide-Grip Rear Pull-Up", key : "wide-grip-rear-pull-up"},
			{name : "Wide-Grip Standing Barbell Curl", key : "wide-grip-standing-barbell-curl"},
			{name : "Wide-Legged Barbell Squat", key : "wide-stance-barbell-squat"},
			{name : "Wide-Stance Barbell Squat", key : "wide-stance-barbell-squat"},
			{name : "Wide-Stance Leg Press", key : "wide-stance-leg-press"},
			{name : "Wide-Stance Stiff Legs", key : "wide-stance-stiff-legs"},
			{name : "Wide Grip Barbell Curl", key : "wide-grip-standing-barbell-curl"},
			{name : "Wide Grip Lat Pulldown", key : "wide-grip-lat-pulldown"},
			{name : "Wide Grip Standing Barbell Curl", key : "wide-grip-standing-barbell-curl"},
			{name : "Wide Stance Barbell Squat", key : "wide-stance-barbell-squat"},
			{name : "Wide Stance Deadlift", key : "sumo-deadlift"},
			{name : "Wide Stance Stiff-Legged Deadlift", key : "wide-stance-stiff-legs"},
			{name : "Wide Stance Stiff Legs", key : "wide-stance-stiff-legs"},
			{name : "Windmills", key : "windmills"},
			{name : "Wind Sprints", key : "wind-sprints"},
			{name : "World's Greatest Stretch", key : "worlds-greatest-stretch"},
			{name : "Wrist Circles", key : "wrist-circles"},
			{name : "Wrist Roller", key : "wrist-roller"},
			{name : "Wrist Rotations with Straight Bar", key : "wrist-rotations-with-straight-bar"},
			{name : "Yates Row", key : "reverse-grip-bent-over-rows"},
			{name : "Yoke Walk", key : "yoke-walk"},
			{name : "Zercher Squats", key : "zercher-squats"},
			{name : "Zottman Curl", key : "zottman-curl"},
			{name : "Zottman Preacher Curl", key : "zottman-preacher-curl"}];
});

app.factory("newItemFactory", function($ionicPopover) {
	return {
		openPopover : function($event, $scope, newItemName, newItemPlaceholder, addNewItemFn) {

			$scope.openPopoverOptions = {
		 		newItemName : newItemName,
		 		newItemInput : undefined,
		 		addNewItem : addNewItemFn
		 	};

			$ionicPopover.fromTemplateUrl('views/new-item.html', {
			 	scope: $scope
			}).then(function(popover) {
			    $scope.popover = popover;
			    $scope.popover.show($event);
			});
		}
	};
});

app.factory("newExerciseFactory", function($ionicPopover, dataService) {
	return {
		openPopover : function($event, $scope, addNewItemFn) {

			$scope.openPopoverOptions = {
		 		newItemInput : undefined,
		 		addNewItem : addNewItemFn,
		 		exerciseDb : dataService.exerciseDb,
		 		stringLen : dataService.stringLen
		 	};

			$ionicPopover.fromTemplateUrl('views/new-exercise.html', {
			 	scope: $scope
			}).then(function(popover) {
			    $scope.popover = popover;
			    $scope.popover.show($event);
			});
		}
	};
});
