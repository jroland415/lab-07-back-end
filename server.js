'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

require('dotenv').config();
const PORT = process.env.PORT;

const app = express();

app.use(cors());

app.get('/location', searchToLatLong);
app.get('/weather', searchWeather);
app.use('*', (request, response) => response.status(500).send('Sorry, that route does not exist.'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

function searchToLatLong(req, res) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${req.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then((apiResponse) => {
      let location = new Location(req.query.data, apiResponse);
      res.send(location);
    })
    .catch((err) => handleError(err, res));
}

function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function searchWeather(req, res) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${req.query.data.latitude},${req.query.data.longitude}`;

  return superagent.get(url)
    .then((weatherResponse) => {
      const weatherSummaries = weatherResponse.body.daily.data.map((day) => {
        return new Weather(day);
      });
      res.send(weatherSummaries);
    })
    .catch((err) => handleError(err, res));
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000)
    .toLocaleDateString('en-US', {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'});
}

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Looks like today\'s not your day');
}
