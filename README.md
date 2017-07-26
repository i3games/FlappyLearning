# Flappy Learning

This is a fork of [https://github.com/xviniette/FlappyLearning/](https://github.com/xviniette/FlappyLearning/), a
[Neuroevolution](http://www.scholarpedia.org/article/Neuroevolution) approach to play Flappy Bird.

Original code and all artwork in this project by Vincent Bazia.

In order to understand the code, I rewrote it in a more [ES6](http://exploringjs.com/es6/index.html)'ish style.
Details can be found in [NOTES.md](https://github.com/i3games/FlappyLearning/blob/gh-pages/NOTES.md)

([Demo](http://xviniette.github.io/FlappyLearning/))
![alt tag](https://github.com/xviniette/FlappyLearning/blob/gh-pages/img/flappy.png?raw=true)

### [neuroevolution.js](https://github.com/i3games/FlappyLearning/blob/gh-pages/neuroevolution.js) : API
```javascript
// Initialize
const ne = new Neuroevolution({ options });

// Update options
ne.set({ options });

// Generate a generation
const generation = ne.nextGeneration();

// Initialize the generations
ne.restart();

// When an network is over -> save this score
ne.networkScore(generation[x], score);
```

### [neuroevolution.js](https://github.com/i3games/FlappyLearning/blob/gh-pages/neuroevolution.js) : Default Options

```javascript
const options = {
  activation: function (a) {  // Neuron activation function
    return (1 / (1 + Math.exp(-a)));
  },
  initialization: function () { // Weight initialization function
    return Math.random() * 2 - 1;
  },
  network: [1, [1], 1],    // Perceptron network structure (1 hidden layer).
  population: 50,          // Population by generation.
  elitism: 0.2,            // Best networks kept unchanged for the next generation (rate).
  randomBehaviour: 0.2,    // New random networks for the next generation (rate).
  mutationRate: 0.1,       // Mutation rate on the weights of synapses.
  mutationRange: 0.5,      // Interval of the mutation changes on the synapse weight.
  historic: 0,             // Latest generations saved.
  lowHistoric: false,      // Only save score (not the network).
  scoreSort: -1,           // Sort order (-1 = desc, 1 = asc).
  numChildren: 1           // Number of children by breeding.
};
```
