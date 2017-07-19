class Neuron {
  constructor () {
    this.value = 0;
    this.weights = [];
  }

  populate (numInputs, values) {
    this.weights = [];
    for (let i = 0; i < numInputs; i++) {
      this.weights.push(values);
    }
  }
}

class Layer {
  constructor (index = 0) {
    this.id = index;
    this.neurons = [];
  }

  populate (numNeurons, numInputs, values) {
    this.neurons = [];
    for (let i = 0; i < numNeurons; i++) {
      let neuron = new Neuron();
      neuron.populate(numInputs, values);
      this.neurons.push(neuron);
    }
  }
}

class Network {
  constructor () { this.layers = []; }

  generateLayers (numInputs, hiddens, numOutputs, values) {
    let index = 0;
    let numPreviousNeurons = 0;
    let layer;
    // imput layer
    layer = new Layer(index);
    layer.populate(numInputs, numPreviousNeurons, values); // Number of Inputs will be set to
                                                  // 0 since it is an input layer.
    numPreviousNeurons = numInputs;  // number of input is size of previous layer. // TODO check
    this.layers.push(layer);
    index++;
    // hidden layers
    for (let hidden of hiddens) {
      // Repeat same process as first layer for each hidden layer.
      layer = new Layer(index);
      layer.populate(hidden, numPreviousNeurons, values);
      numPreviousNeurons = hidden;
      this.layers.push(layer);
      index++;
    }
    // output layer
    layer = new Layer(index);
    layer.populate(numOutputs, numPreviousNeurons, values);  // Number of input is equal to
                                                    // the size of the last hidden
                // layer.
    this.layers.push(layer);
  }

  save () {
    const data = {
      neurons: [], // number of neurons in each layer
      weights: []
    };
    for (let layer of this.layers) {
      data.neurons.push(layer.neurons.length);
      for (let neuron of layer.neurons) {
        for (let weight of neuron.weights) {
          data.weights.push(weight);
        }
      }
    }
    return data;
  }

  read (save, values) {
    let numPreviousNeurons = 0;
    let index = 0;
    let indexWeights = 0;
    this.layers = [];
    for (let numNeurons of save.neurons) {
      // Create and populate layers.
      let newLayer = new Layer(index);
      newLayer.populate(numNeurons, numPreviousNeurons, values);
      for (let neuron of newLayer.neurons) {
        for (let weight = 0; weight < neuron.weights.length; weight++) {
            // Apply neurons weights to each Neuron.
          neuron.weights[weight] = save.weights[indexWeights];
          indexWeights++; // Increment index of flat array.
        }
      }
      numPreviousNeurons = numNeurons;
      index++;
      this.layers.push(newLayer);
    }
  }

  compute (inputs, activation) { // called from the game: [bird.y / this.height, nextHole], null
    // set the input layer
    const inputLayer = this.layers[0];
    for (let i = 0; i < inputs.length; i++) {
      if (inputLayer && inputLayer.neurons[i]) {
        inputLayer.neurons[i].value = inputs[i];
      }
    }

    // compute the intermediate layers
    let prevLayer = inputLayer;
    for (let l = 1; l < this.layers.length; l++) {
      for (let n = 0; n < this.layers[l].neurons.length; n++) {
        // For each Neuron in each layer.
        let sum = 0;
        for (let prevLayerN = 0; prevLayerN < prevLayer.neurons.length; prevLayerN++) {
            // Every Neuron in the previous layer is an input to each Neuron in
            // the next layer.
          sum = sum + prevLayer.neurons[prevLayerN].value *
                     this.layers[l].neurons[n].weights[prevLayerN];
        }

        // Compute the activation of the Neuron.
        // this.layers[i].neurons[j].value = activation(sum); // this.options.activation(sum)

        // HACK TEMP
        this.layers[l].neurons[n].value = ((a) => {
          const ap = -a / 1;
          return (1 / (1 + Math.exp(ap)));
        })(sum);
      }
      prevLayer = this.layers[l];
    }

    // compute the output layer
    let output = [];
    const outputLayer = this.layers[this.layers.length - 1];
    for (let neuron of outputLayer.neurons) {
      output.push(neuron.value);
    }
    return output;
  }
}

class Genome {
  constructor (score = 0, network) {
    this.score = score;
    this.network = network;
  }
}

class Generation {
  constructor () {
    this.genomes = [];
  }

  addGenome (genome, sortOrder) {
    this.genomes.push(genome);
    this.genomes.sort((a, b) => (a.score - b.score) * Math.sign(sortOrder));
  }

  breed (g1, g2, numChildren, mutationRate, mutationRange) {
    var result = [];
    for (let c = 0; c < numChildren; c++) {
      // Deep clone of genome 1.
      const child = JSON.parse(JSON.stringify(g1)); // TODO !!!!
      for (let w = 0; w < g2.network.weights.length; w++) {
        // Genetic crossover
        // 0.5 is the crossover factor.
        // FIXME Really should be a predefined constant.
        if (Math.random() <= 0.5) {
          child.network.weights[w] = g2.network.weights[w];
        }
      }
      // Perform mutation on some weights.
      for (let w = 0; w < child.network.weights.length; w++) {
        if (Math.random() <= mutationRate) {
          child.network.weights[w] +=   // FIXME
            Math.random() * mutationRange * 2 - mutationRange;
        }
      }
      result.push(child);
    }
    return result;
  }

  generateNextGeneration (elitism, population, randomBehaviour, randomClamped,
    numChildren, mutationRate, mutationRange) {
    const nexts = [];

    for (let i = 0; i < Math.round(elitism * population); i++) {
      if (nexts.length < population) {
        // Push a deep copy of ith Genome's Network.
        nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network))); // TODO
      }
    }

    for (let i = 0; i < Math.round(randomBehaviour * population); i++) {
      const net = JSON.parse(JSON.stringify(this.genomes[0].network));
      for (let k = 0; k < net.weights.length; k++) {
        net.weights[k] = randomClamped();
      }
      if (nexts.length < population) {
        nexts.push(net);
      }
    }

    let max = 0;
    while (true) { // infinite loop
      for (let i = 0; i < max; i++) {
        // Create the children and push them to the nexts array.
        let children = this.breed(
          this.genomes[i],
          this.genomes[max],
          (numChildren > 0 ? numChildren : 1),
          mutationRate,
          mutationRange);
        for (let child of children) {
          nexts.push(child.network);
          if (nexts.length >= population) {
            // Return once number of children is equal to the
            // population by generation value.
            return nexts;
          }
        }
      }
      max++;
      if (max >= this.genomes.length - 1) {
        max = 0;
      }
    }
  }
}

class Generations {
  constructor () {
    this.generations = [];
    let currentGeneration = new Generation(); // TODO never used
  }

  firstGeneration (population, network, randomClamped, numInputs, hiddens, numOutputs) { // FIXME numInputs, hiddens, numOutputs unused.
    const out = [];
    for (let i = 0; i < population; i++) {
      // Generate the Network and save it.
      const nn = new Network();
      nn.generateLayers(network[0], network[1], network[2], randomClamped());
      out.push(nn.save());
    }
    this.generations.push(new Generation());
    return out;
  }

  nextGeneration (elitism, population, randomBehaviour, randomClamped,
    numChildren, mutationRate, mutationRange) {
    if (this.generations.length === 0) { // Need to create first generation.
      return false;
    }

    const gen = this.generations[this.generations.length - 1].generateNextGeneration(
      elitism,
      population,
      randomBehaviour,
      randomClamped, // TODO check
      numChildren,
      mutationRate,
      mutationRange
    );
    this.generations.push(new Generation());
    return gen;
  }

    /**
     * Add a genome to the Generations.
     *
     * @param {genome}
     * @return False if no Generations to add to.
     */

  addGenome (genome, sortOrder) {
    // Can't add to a Generation if there are no Generations.
    if (this.generations.length === 0) { return false; }
    // FIXME addGenome returns void.
    return this.generations[this.generations.length - 1].addGenome(genome, sortOrder);
  }
}

class NeuroEvolution {
  constructor (options) {
    this.options = {
      activation: function (a) {
        const ap = (-a) / 1;
        return (1 / (1 + Math.exp(ap)));
      },
      randomClamped: function () {
        return Math.random() * 2 - 1;
      },
      network: [1, [1], 1],    // Perceptron network structure (1 hidden layer).
      population: 50,          // Population by generation.
      elitism: 0.2,            // Best networks kepts unchanged for the next generation (rate).
      randomBehaviour: 0.2,    // New random networks for the next generation (rate).
      mutationRate: 0.1,       // Mutation rate on the weights of synapses.
      mutationRange: 0.5,      // Interval of the mutation changes on the synapse weight.
      historic: 0,             // Latest generations saved.
      lowHistoric: false,      // Only save score (not the network).
      scoreSort: -1,           // Sort order (-1 = desc, 1 = asc).
      numChildren: 1           // Number of children by breeding.
    };

    this.set(options); // Overriding default options with the pass in options
    this.generations = new Generations();
  }

  set (options) {
    for (let option in options) {
      if (this.options[option] != null) {   // Only override if the passed in value                                            // is actually defined.
        this.options[option] = options[option];
      }
    }
  }

  restart () {
    this.generations = new Generations();
  }

  nextGeneration () {
    let networks = [];

    if (this.generations.generations.length === 0) { // If no Generations, create first.
      networks = this.generations.firstGeneration(
        this.options.population,
        this.options.network,
        this.options.randomClamped
      );
    } else { // Otherwise, create next one.
      networks = this.generations.nextGeneration(
        this.options.elitism,
        this.options.population,
        this.options.randomBehaviour,
        this.options.randomClamped, // TODO check
        this.options.numChildren,
        this.options.mutationRate,
        this.options.mutationRange
      );
    }

    // Create Networks from the current Generation.
    const nns = [];
    for (let net of networks) {
      const nn = new Network();
      nn.read(net, this.options.randomClamped()); // TODO
      nns.push(nn);
    }

    // If option set, remove old networks.
    if (this.options.lowHistoric) {
      if (this.generations.generations.length >= 2) {
        const genomes = this.generations.generations[this.generations.generations.length - 2].genomes;
        for (let i = 0; i < genomes.length; i++) {
          delete genomes[i].network;
        }
      }
    }

    // If option set, remove older generations.
    if (this.options.historic !== -1) {
      if (this.generations.generations.length > this.options.historic + 1) {
        this.generations.generations.splice(0, this.generations.generations.length - (this.options.historic + 1));
      }
    }

    return nns;
  }

  networkScore (network, score) {
    this.generations.addGenome(new Genome(score, network.save()), this.options.scoreSort);
  }
}
