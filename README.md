# Bean API

## About

Experience the convenience of ordering your favorite coffee with our easy-to-use API.

## Requirements

- [Node v20^](https://nodejs.org)
- [Postgresql v15^](https://www.postgresql.org)

## Installation

### Set up Your environment variable or create .env file:

```sh
PGUSER=
PGPASSWORD=
PGHOST=
PGPORT=
PGDATABASE=
```

> See **.env.example** file for example

### Install dependencies

```sh
npm install
```

### Init Database

```sh
npm run init
```

## Run

```sh
npm start
```
> Try to open Your browser [localhost:3000](http://localhost:3000)

## Example usage
```sh
curl 'http://localhost:3000/api/product'
```
