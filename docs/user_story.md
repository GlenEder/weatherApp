# Coding Exercise

## User Story

As a user, I want to search for a city and see its current weather, so that I can quickly check conditions before I go outside.

Client:

    Make a React frontend using Vite (npm create vite@latest weather -- --template react-ts)
    The app should have a form with a field for searching a city by name
    Upon submitting the form, the client app should make a request to the local server's /locations endpoint, sending the search term via a query param
    Since city names are often ambiguous (e.g. there are dozens of "Springfield"s), display the returned matches in a list that shows enough detail to tell them apart, and let the user select the correct one
    Once a city is selected, the client app should make a request to the local server's /weather endpoint, sending that city's coordinates via query params
    Display the returned weather in a clean, well-organized layout — temperature, condition, humidity, wind, and any other details you'd like to include
    Handle the empty/no-results and loading states visibly, rather than leaving the user looking at a blank screen

Server:

    Make a simple server using Node, Express, and TypeScript
    The server should expose an endpoint /locations that takes a query param of a search term, and returns matching cities using the Open-Meteo Geocoding API
    The server should expose an endpoint /weather that takes query params of latitude and longitude, and returns the current weather for those coordinates using the Open-Meteo Forecast API

## Technologies To Use:

    TypeScript, properly typing all variables
    Material UI for the user interface

Bonus Points for:

    Implement unit tests using Jest

## Implementation Requirements

You can include and use any npm packages that you feel would be helpful.

You should supply a README file explaining how to build and run your submission.

NOTE: Open-Meteo's public endpoints require no API key and no signup. There are no meaningful rate limits at this scale, so you shouldn't need to worry about throttling during development.

