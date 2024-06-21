"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

////////////////////////////////////////////////////
//  common
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration;
    // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

//////////////////////////////////////////////////////////////
// Running

class Running extends Workout {
  type = "running";
  constructor(coods, distance, duration, cadence) {
    super(coods, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

//////////////////////////////////////////////////////////////
// Cycling

class Cycling extends Workout {
  type = "cycling";
  constructor(coods, distance, duration, elevation) {
    super(coods, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////
// Architecture

class App {
  #map; // private data
  #mapEvent;
  #workouts = [];
  /// constructor contains event listeneres

  constructor() {
    // get users position
    this._getPosition();
    // get data form local storage
    this._getLocalStorage();
    // arrach event listeners
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField.bind(this));
    containerWorkouts.addEventListener("click", this._moveTopopup.bind(this));
  }

  // find current cooredinates

  _getPosition() {
    // Geolocation Api

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("count not get your Location");
        }
      );
    }
  }

  // load map according to the coordinates

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //   L.marker(coords).addTo(map).openPopup();

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  // show ford when clicked on the map

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    // clear input fields
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";

    form.style.display = "none";
    form.classList.add("hidden");

    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  // toggle between running and cycling

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  // add neew workout

  _newWorkout(e) {
    // iinput validation funcion

    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    //

    const allPositive = (...values) => values.every((inp) => inp > 0);

    // get the data from the form

    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // check the type is running

    if (type === "running") {
      const cadence = Number(inputCadence.value);

      // input validation for runnig
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert("input have to be positive number");
      }

      // new object creation for running

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // check if the ty pe is cycling
    if (type === "cycling") {
      const elevation = Number(inputElevation.value);

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("input have to be positive number");

      // new object creation for cycling

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    // render workdout list

    e.preventDefault();

    this._renderWorkout(workout);

    this._renderWorkoutMarker(workout);

    this._hideForm();

    this._setLocalStorage();
  }

  // rendering marker according to type

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.discription}`
      )
      .openPopup();
  }

  // Rendering worlk out list

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.discription}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;

    if (workout.type === "running") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    if (workout.type === "cycling") {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> 
      `;
    }

    form.insertAdjacentHTML("afterend", html);
  }

  _moveTopopup(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });

    workout.click();
  }

  // setting local storage

  _setLocalStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workout"));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workout");
    location.reload();
  }
}

const app = new App();

class Member {
  collage = 'Wmo Arts & Science Collage';
  constructor(name, age, place) {
    this.name = name;
    this.age = age;
    this.place = place;
  }

  greeting() {
    console.log(`Hello ${this.name} Welcome to ${this.collage},`);
  }
}

class Student extends Member {
  constructor(name, age, place, adNo, course, AdYear, Dob) {
    super(name, age, place);
    this.adNo = adNo;
    this.course = course;
    this.AdYear = AdYear;
    this.Dob = Dob;
    this.greeting();
  }
}

class Teacher extends Member {
  constructor(name, age, place, phone, Eid, dept) {
    super(name, age, place);
    this.phone = phone;
    this.Eid = Eid;
    this.dept = dept;
    this.greeting()
  }
}



