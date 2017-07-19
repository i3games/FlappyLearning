# About the rewrite


I find it easy to translate ES5 '.prototype' constructions into `class`, and I also think it is pleasant to read.

There are well known objections against the `class` keyword introduced in ES6, but I think eventually it will become a new Standard(pun), aside from functional style programming.

Indeed, the code could be simplified dramatically. Everything can be expressed in plain objects and arrays: A neuron has a value and a array of weights, a layer has an id and an array of neurons, and so on. Here is an overview:    

```
Neuron = {
  value: 0,
  weights: [0]
}

Layer = {
  id: 0,
  neurons: [Neuron]
}

Network = {
  layers: [Layer]
}

(StoredNetwork) = { // used to store Network in Genomes, see Network.save() and Network.read()
  neurons: [0], // number of neurons in each layer
  weights: [0]   // flat list of weights
}

Genome = {
  score: 0,
  network: (StoredNetwork)
}

Generation = {
  genomes: [Genome]
}

Generations = {
  currentGeneration: Generation, // not used
  generation: [Generation]
}

NeuroEvolution = {
  options: {},
  generations: Generations
}

Bird = {
  // ..
}

Pipe = {
  // ..
}

Game = {
  birds: [Bird],
  pipes: [Pipe],
  neuvol: NeuroEvolution
  // ..
}
```
