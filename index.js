const cors = require('cors');
const express = require('express');
const fs = require('fs');
const json = require('./config.json');

const plant_map = {};
const bed_map = {};
const slot_map = {};

let last_plant_id = 0;
let last_bed_id = 0;

json.plants.forEach((plant, i) => {
  plant_map[plant.id] = i;
  if (plant.id > last_plant_id) {
    last_plant_id = plant.id;
  }
});

json.beds.forEach((bed, i) => {
  bed_map[bed.id] = i;
  if (bed.id > last_bed_id) {
    last_bed_id = bed.id;
  }
});

json.beds.forEach((bed) => {
  slot_map[bed.id] = {};
  bed.plants.forEach((plant, i) => {
    if (!(plant.slot[0] in slot_map[bed.id])) {
      slot_map[bed.id][plant.slot[0]] = {};
    }
    slot_map[bed.id][plant.slot[0]][plant.slot[1]] = i;
  });
});

const port = 3000;

const app = express();
app.use(cors());
app.options('*', cors());

const updateJSON = () => {
  fs.writeFileSync("./config.json", JSON.stringify(json, null, 2));
}

app.get('/update/bed', (req, res) => {
  req.query.cols = parseInt(req.query.cols, 10);
  req.query.rows = parseInt(req.query.rows, 10);
  req.query.width = parseInt(req.query.width, 10);
  req.query.height = parseInt(req.query.height, 10);

  json.beds[bed_map[req.query.id]].name = req.query.name;
  json.beds[bed_map[req.query.id]].slots = {
    cols: req.query.cols,
    rows: req.query.rows
  };
  json.beds[bed_map[req.query.id]].size = {
    width: req.query.width,
    height: req.query.height
  };

  updateJSON();
  res.json(json);
});

app.get('/update/plant', (req, res) => {
  json.plants[plant_map[req.query.id]].name = req.query.name;
  json.plants[plant_map[req.query.id]].icon = req.query.icon;
  json.plants[plant_map[req.query.id]].type = req.query.type;
  json.plants[plant_map[req.query.id]].enemies = req.query.enemies.split(",");
  json.plants[plant_map[req.query.id]].friends = req.query.friends.split(",");

  updateJSON();
  res.json(json);
});

app.get('/insert/bed', (req, res) => {
  req.query.cols = parseInt(req.query.cols, 10);
  req.query.rows = parseInt(req.query.rows, 10);
  req.query.width = parseInt(req.query.width, 10);
  req.query.height = parseInt(req.query.height, 10);

  last_bed_id++;
  bed_map[last_bed_id] = json.beds.length;

  json.beds.push({
    id: last_bed_id,
    name: req.query.name,
    slots: {
      cols: req.query.cols,
      rows: req.query.rows
    },
    size: {
      width: req.query.width,
      height: req.query.height
    },
    plants:[]
  });
  
  updateJSON();
  res.json(json);
});

app.get('/update/slot', (req, res) => {
  req.query.x = parseInt(req.query.x, 10);
  req.query.y = parseInt(req.query.y, 10);
  req.query.bed_id = parseInt(req.query.bed_id, 10);

  if (req.query.plant_id === "false") {
    req.query.plant_id = false;
  } else {
    req.query.plant_id = parseInt(req.query.plant_id, 10);
  }

  let exists = true;
  if (!(req.query.x in slot_map[req.query.bed_id])) {
    slot_map[req.query.bed_id][req.query.x] = {};
    exists = false;
  }
  if (!(req.query.y in slot_map[req.query.bed_id][req.query.x])) {
    slot_map[req.query.bed_id][req.query.x][req.query.y] = json.beds[bed_map[req.query.bed_id]].plants.length;
    exists = false;
  }
  
  if (!exists) {
    json.beds[bed_map[req.query.bed_id]].plants.push({
      plant_id: req.query.plant_id,
      slot: [req.query.x, req.query.y]
    });
  } else {
    const slot_id = slot_map[req.query.bed_id][req.query.x][req.query.y];
    json.beds[bed_map[req.query.bed_id]].plants[slot_id].plant_id = req.query.plant_id;  
  }

  updateJSON();
  res.json(json);
});

app.get('/insert/plant', (req, res) => {
  last_plant_id++;
  plant_map[last_plant_id] = json.plants.length;

  json.plants.push({
    name: req.query.name,
    icon: req.query.icon,
    type: req.query.type,
    enemies: req.query.enemies.split(","),
    friends: req.query.friends.split(",")
  });

  updateJSON();
  res.json(json);
});

app.get('/data', (req, res) => {
  res.json(json);
});

app.use(express.static('app'));

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});