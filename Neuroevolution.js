class Neuron {
	constructor () {
		this.value = 0;
		this.weights = [];
	}

	populate (inputs, values) {
		this.weights = [];
		for (let i = 0; i < inputs; i++) {
			this.weights.push(values);
		}
	}
}

class Layer {
	contructor (index) {
			this.id = index || 0;
			this.neurons = [];
	}

	populate (neurons, inputs, values) {
		this.neurons = [];
		for (let i = 0; i < neurons; i++) {
			let neuron = new Neuron();
			neuron.populate(inputs, values);
			this.neurons.push(neuron);
		}
	}
}

class Network {
	constructor () { this.layers = []; }

	generateLayers (input, hiddens, output, values) {
		let index = 0;
		let previousNeurons = 0;
		let layer;
		// input
		layer = new Layer(index);
		layer.populate(input, previousNeurons, values); // Number of Inputs will be set to
																									// 0 since it is an input layer.
		previousNeurons = input;  // number of input is size of previous layer.
		this.layers.push(layer);
		index++;
		// hidden
		for (let h in hiddens) {
			// Repeat same process as first layer for each hidden layer.
			layer = new Layer(index);
			layer.populate(hiddens[h], previousNeurons, values);
			previousNeurons = hiddens[h];
			this.layers.push(layer);
			index++;
		}
		// output
		layer = new Layer(index);
		layer.populate(output, previousNeurons, values);  // Number of input is equal to
																										// the size of the last hidden
								// layer.
		this.layers.push(layer);
	}

	save () {
		const data = {
			neurons: [], // number of neurons in each layer
			weights: []
		};
		for(let layer in this.layers){
			data.neurons.push(this.layers[layer].neurons.length);
			for(let neuron in this.layers[layer].neurons){
				for(let weight in this.layers[layer].neurons[neuron].weights){
					data.weights.push(this.layers[layer].neurons[neuron].weights[weight]);
				}
			}
		}
		return data;
	}

	read (save, values) {
		let previousNeurons = 0;
		let index = 0;
		let indexWeights = 0;
		this.layers = [];
		for (let neurons in save.neurons) {
			// Create and populate layers.
			let newLayer = new Layer(index);
			newLayer.populate(save.neurons[neurons], previousNeurons, values);
			for (let layer in newLayer.neurons) {
				for (let weight in newLayer.neurons[layer].weights) {
	  				// Apply neurons weights to each Neuron.
					newLayer.neurons[layer].weights[weight] = save.weights[indexWeights];
					indexWeights++; // Increment index of flat array.
				}
			}
			previousNeurons = save.neurons[neurons];
			index++;
			this.layers.push(newLayer);
		}
	}

	compute (inputs, activation) {
		// set the input layer
		const inputLayer = this.layers[0];
		for (let input in inputs) {
			if (inputLayer && inputLayer.neurons[input]) {
				inputLayer.neurons[input].value = inputs[input];
			}
		}

		// compute the intermediate layers
		let prevLayer = inputLayer;
		for(let layer = 1; layer < this.layers.length; layer++){
			for(let neuron in this.layers[layer].neurons){
				// For each Neuron in each layer.
				let sum = 0;
				for (let prevLayerNeuron in prevLayer.neurons){
	  				// Every Neuron in the previous layer is an input to each Neuron in
	  				// the next layer.
					sum = sum + prevLayer.neurons[prevLayerNeuron].value
	       						* this.layers[layer].neurons[neuron].weights[prevLayerNeuron];
				}

				// Compute the activation of the Neuron.
				// this.layers[i].neurons[j].value = activation(sum); // self.options.activation(sum)

				// HACK TEMP
				this.layers[layer].neurons[neuron].value = ( (a) => {
					const ap = -a / 1;
					return (1 / (1 + Math.exp(ap)));
				})(sum);

			}
			prevLayer = this.layers[layer];
		}

		// compute the output layer
		let output = [];
		const outputLayer = this.layers[this.layers.length - 1];
		for (let neuron in outputLayer.neurons) {
			output.push(outputLayer.neurons[neuron].value);
		}
		return output;
	}
}

class Genome { // a score and a neural network
	constructor (score = 0, network) {
		this.score = score;
		this.network = network;
	}
}

/**
 * Provides a set of classes and methods for handling NeuroEvolution and
 * genetic algorithms.
 *
 * @param {options} An object of options for NeuroEvolution.
 */
var NeuroEvolution = function(options){
	var self = this;  // reference to the top scope of this module

 	// Declaration of module parameters (options) and default values
	self.options = {
    	/**
     	 * Logistic activation function.
     	 *
	 * @param {a} Input value.
	 * @return Logistic function output.
	 */
		activation: function(a){
			ap = (-a)/1;
			return (1/(1 + Math.exp(ap)))
		},

		/**
		 * Returns a random value between -1 and 1.
		 *
		 * @return Random value.
		 */
		randomClamped: function(){
			return Math.random() * 2 - 1;
		},

		// various factors and parameters (along with default values).
		network:[1, [1], 1],    // Perceptron network structure (1 hidden
					// layer).
		population:50,          // Population by generation.
		elitism:0.2,            // Best networks kepts unchanged for the next
				        // generation (rate).
		randomBehaviour:0.2,    // New random networks for the next generation
				        // (rate).
		mutationRate:0.1,       // Mutation rate on the weights of synapses.
		mutationRange:0.5,      // Interval of the mutation changes on the
				        // synapse weight.
		historic:0,             // Latest generations saved.
		lowHistoric:false,      // Only save score (not the network).
		scoreSort:-1,           // Sort order (-1 = desc, 1 = asc).
		nbChild:1               // Number of children by breeding.

	}

	/**
	 * Override default options.
	 *
	 * @param {options} An object of Neuroevolution options.
	 * @return void
	 */
	self.set = function(options){
		for(var i in options){
      			if(this.options[i] != undefined){ // Only override if the passed in value
                        	                  	  // is actually defined.
				self.options[i] = options[i];
			}
		}
	}

	// Overriding default options with the pass in options
	self.set(options);

/*GENOME**********************************************************************/
	/**
	 * Genome class.
	 *
	 * Composed of a score and a Neural Network.
	 *
	 * @constructor
	 *
	 * @param {score}
	 * @param {network}
	 */



/*GENERATION******************************************************************/
	/**
	 * Generation class.
	 *
	 * Composed of a set of Genomes.
	 *
	 * @constructor
	 */
	var Generation = function(){
		this.genomes = [];
	}

	/**
	 * Add a genome to the generation.
	 *
	 * @param {genome} Genome to add.
	 * @return void.
	 */
	Generation.prototype.addGenome = function(genome){
    		// Locate position to insert Genome into.
    		// The gnomes should remain sorted.
		for(var i = 0; i < this.genomes.length; i++){
      			// Sort in descending order.
			if(self.options.scoreSort < 0){
				if(genome.score > this.genomes[i].score){
					break;
				}
			// Sort in ascending order.
			}else{
				if(genome.score < this.genomes[i].score){
					break;
				}
			}

		}

		// Insert genome into correct position.
		this.genomes.splice(i, 0, genome);
	}

	/**
	 * Breed to genomes to produce offspring(s).
	 *
	 * @param {g1} Genome 1.
	 * @param {g2} Genome 2.
	 * @param {nbChilds} Number of offspring (children).
	 */
	Generation.prototype.breed = function(g1, g2, nbChilds){
		var datas = [];
		for(var nb = 0; nb < nbChilds; nb++){
			// Deep clone of genome 1.
			var data = JSON.parse(JSON.stringify(g1));
			for(var i in g2.network.weights){
				// Genetic crossover
				// 0.5 is the crossover factor.
				// FIXME Really should be a predefined constant.
				if(Math.random() <= 0.5){
					data.network.weights[i] = g2.network.weights[i];
				}
			}

			// Perform mutation on some weights.
			for(var i in data.network.weights){
				if(Math.random() <= self.options.mutationRate){
					data.network.weights[i] += Math.random()
						* self.options.mutationRange
				   		* 2
				   		- self.options.mutationRange;
				}
			}
			datas.push(data);
		}

		return datas;
	}

	/**
	 * Generate the next generation.
	 *
	 * @return Next generation data array.
	 */
	Generation.prototype.generateNextGeneration = function(){
		var nexts = [];

		for(var i = 0; i < Math.round(self.options.elitism
                                 * self.options.population); i++){
			if(nexts.length < self.options.population){
        			// Push a deep copy of ith Genome's Nethwork.
				nexts.push(JSON.parse(JSON.stringify(this.genomes[i].network)));
			}
		}

		for(var i = 0; i < Math.round(self.options.randomBehaviour
                                 * self.options.population); i++){
			var n = JSON.parse(JSON.stringify(this.genomes[0].network));
			for(var k in n.weights){
				n.weights[k] = self.options.randomClamped();
			}
			if(nexts.length < self.options.population){
				nexts.push(n);
			}
		}

		var max = 0;
		while(true){
			for(var i = 0; i < max; i++){
        			// Create the children and push them to the nexts array.
        			var childs = this.breed(this.genomes[i], this.genomes[max],
                     		(self.options.nbChild > 0 ? self.options.nbChild : 1) );
				for(var c in childs){
					nexts.push(childs[c].network);
					if(nexts.length >= self.options.population){
						// Return once number of children is equal to the
						// population by generatino value.
						return nexts;
					}
				}
			}
			max++;
			if(max >= this.genomes.length - 1){
				max = 0;
			}
		}
	}


/*GENERATIONS*****************************************************************/
	/**
	 * Generations class.
	 *
	 * Hold's previous Generations and current Generation.
	 *
	 * @constructor
	 */
	var Generations = function(){
		this.generations = [];
		var currentGeneration = new Generation();
	}

	/**
	 * Create the first generation.
	 *
	 * @param {input} Input layer.
	 * @param {input} Hidden layer(s).
	 * @param {output} Output layer.
	 * @return First Generation.
	 */
	Generations.prototype.firstGeneration = function(input, hiddens, output){
    		// FIXME input, hiddens, output unused.

		var out = [];
		for(var i = 0; i < self.options.population; i++){
      			// Generate the Network and save it.
			var nn = new Network();
			nn.generateLayers(
				self.options.network[0],
				self.options.network[1],
        self.options.network[2],
				self.options.randomClamped());
			out.push(nn.save());
		}

		this.generations.push(new Generation());
		return out;
	}

	/**
	 * Create the next Generation.
	 *
	 * @return Next Generation.
	 */
	Generations.prototype.nextGeneration = function(){
		if(this.generations.length == 0){
			// Need to create first generation.
			return false;
		}

		var gen = this.generations[this.generations.length - 1]
				.generateNextGeneration();
		this.generations.push(new Generation());
		return gen;
	}

	/**
	 * Add a genome to the Generations.
	 *
	 * @param {genome}
	 * @return False if no Generations to add to.
	 */
	Generations.prototype.addGenome = function(genome){
    		// Can't add to a Generation if there are no Generations.
		if(this.generations.length == 0) return false;

   		 // FIXME addGenome returns void.
		return this.generations[this.generations.length - 1].addGenome(genome);
	}


/*SELF************************************************************************/
	self.generations = new Generations();

	/**
	 * Reset and create a new Generations object.
	 *
	 * @return void.
	 */
	self.restart = function(){
		self.generations = new Generations();
	}

	/**
	 * Create the next generation.
	 *
	 * @return Neural Network array for next Generation.
	 */
	self.nextGeneration = function(){
		var networks = [];

		if(self.generations.generations.length == 0){
      			// If no Generations, create first.
			networks = self.generations.firstGeneration();
		}else{
      			// Otherwise, create next one.
			networks = self.generations.nextGeneration();
		}

    		// Create Networks from the current Generation.
		var nns = [];
		for(var i in networks){
			var nn = new Network();
			nn.read(networks[i], self.options.randomClamped());
			nns.push(nn);
		}

		if(self.options.lowHistoric){
      			// Remove old Networks.
			if(self.generations.generations.length >= 2){
				var genomes =
					self.generations
						.generations[self.generations.generations.length - 2]
              					.genomes;
				for(var i in genomes){
					delete genomes[i].network;
				}
			}
		}

		if(self.options.historic != -1){
      			// Remove older generations.
			if(self.generations.generations.length > self.options.historic + 1){
        			self.generations.generations.splice(0,
            			self.generations.generations.length - (self.options.historic + 1));
			}
		}

		return nns;
	}

	/**
	 * Adds a new Genome with specified Neural Network and score.
	 *
	 * @param {network} Neural Network.
	 * @param {score} Score value.
	 * @return void.
	 */
	self.networkScore = function(network, score){
		self.generations.addGenome(new Genome(score, network.save()));
	}
}
