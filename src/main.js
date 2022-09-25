const basePath = process.cwd();
const { NETWORK } = require(`${basePath}/constants/network.js`);
const fs = require("fs");
const { nextTick } = require("process");
const sha1 = require(`${basePath}/node_modules/sha1`);
const { createCanvas, loadImage } = require(`${basePath}/node_modules/canvas`);
const buildDir = `${basePath}/build`;
const layersDir = `${basePath}/layers`;
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
} = require(`${basePath}/src/config.js`);
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
let metadataList = [];
let attributesList = [];
let dnaList = new Set();
const DNA_DELIMITER = "-";
const HashlipsGiffer = require(`${basePath}/modules/HashlipsGiffer.js`);

let hashlipsGiffer = null;

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
  if (gif.export) {
    fs.mkdirSync(`${buildDir}/gifs`);
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  let nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  let dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  let nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path, type) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }

      // @ is a delimiter in our conditionnal format.
      let fileParts = i.split("@");
      // We remove the extension and rarity at the end
      fileParts[fileParts.length-1] = fileParts[fileParts.length-1].split("#")[0]; 

      return {
        id: index,
        fileParts: fileParts,
        fileId: (fileParts[1] == undefined && fileParts[0] == "none")?"none":fileParts[1],
        denies: fileParts[2],
        allows: fileParts[3],
        name: fileParts[0],
        type: type,
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${layersDir}/${layerObj.name}/`, layerObj.type.toLowerCase()),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    type:
      layerObj.options?.["type"] != undefined
        ? layerObj.options?.["type"]
        : layerObj.type.toLowerCase(),
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
  }));
  return layers;
};

const saveImage = (_editionCount) => {
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}.png`,
    canvas.toBuffer("image/png")
  );
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (_dna, _edition) => {
  let dateTime = Date.now();
  let tempMetadata = {
    name: `${namePrefix} #${_edition}`,
    description: description,
    image: `${baseUri}/${_edition}.png`,
    dna: sha1(_dna),
    edition: _edition,
    date: dateTime,
    ...extraMetadata,
    attributes: attributesList,
    compiler: "HashLips Art Engine",
  };
  if (network == NETWORK.sol) {
    tempMetadata = {
      //Added metadata for solana
      name: tempMetadata.name,
      symbol: solanaMetadata.symbol,
      description: tempMetadata.description,
      //Added metadata for solana
      seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
      image: `${_edition}.png`,
      //Added metadata for solana
      external_url: solanaMetadata.external_url,
      edition: _edition,
      ...extraMetadata,
      attributes: tempMetadata.attributes,
      properties: {
        files: [
          {
            uri: `${_edition}.png`,
            type: "image/png",
          },
        ],
        category: "image",
        creators: solanaMetadata.creators,
      },
    };
  }
  metadataList.push(tempMetadata);
  attributesList = [];
};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  try {
    return new Promise(async (resolve) => {
      const image = await loadImage(`${_layer.selectedElement.path}`);
      resolve({ layer: _layer, loadedImage: image });
    });
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.globalCompositeOperation = _renderObject.layer.blend;
  text.only
    ? addText(
        `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
        text.xGap,
        text.yGap * (_index + 1),
        text.size
      )
    : ctx.drawImage(
        _renderObject.loadedImage,
        0,
        0,
        format.width,
        format.height
      );

  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna = "", _layers = []) => {
  let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    return {
      name: layer.name,
      fileParts: layer.fileParts,
      fileId: layer.fileId,
      denies: layer.denies,
      allows: layer.allows,
      type: layer.type,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    };
  });
  return mappedDnaToLayers;
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

// Search if element is denied or not
const isElementInDeniedList = (type, list, fileId, exceptions) => {
  type = type.toLowerCase();

  for (let i = 0; i < exceptions.length; i++) {
    if (exceptions[i].type != type)
      continue;
  
    if (list.includes(exceptions[i].fileId)) {
      debugLogs
      ? console.log("ELEM is in exception list: " + type + " / " + fileId)
      : null;
      return true;
    }
  }

  return false;
};

// Is the element denied by previous rules ?
const isDenied = (denied, type, fileId) => {
  if (!denied[type] || denied[type] == undefined)
    return false;

  if (denied[type].includes('*'))
    return true;

  if (denied[type].includes(fileId))
    return true;
    
  return false;
};

// Is the element allowed by previous rules
const isAllowed = (allowed, type, fileId) => {
  // Not denied and no allow list
  if (!allowed[type] || allowed[type] == undefined)
    return true;

  if (allowed[type].includes(fileId))
    return true;
    
  return false
};

 // Save exceptions for easy lookup
const recordExceptions = (type, list, exceptions) => {
    if (exceptions[type] == undefined) {
      exceptions[type] = [];
    }

    exceptions[type] = exceptions[type].concat(list);
};

// Check deny rules against already selected elements
const checkDenyRulesAgainstSelectedElems = (type, list, selectedElems) => {
  for (let i = 0; i < selectedElems.length; i++) {
    if (selectedElems[i].type != type || selectedElems[i].name == 'none') 
      continue;

    if (list.includes(selectedElems[i].fileId))
      return false;
  }

  return true;
}

// Check allow rules against already selected elements
const checkAllowRulesAgainstSelectedElems = (type, list, selectedElems) => {
  for (let i = 0; i < selectedElems.length; i++) {
    if (selectedElems[i].type != type || selectedElems[i].name == 'none') 
      continue;

    if (!list.includes(selectedElems[i].fileId))
      return false;
  }

  return true;
}

const pickElement = (layer, values, allowed, denied) => {
  let totalWeight = 0;

  layer.elements.forEach((element) => {
    totalWeight += element.weight;
  });

  // number between 0 - totalWeight
  let random = Math.floor(Math.random() * totalWeight);
  for (let i = 0; i < layer.elements.length; i++) {
    // subtract the current weight from the random weight until we reach a sub zero value.
    random -= layer.elements[i].weight;
    if (random < 0) {
      //console.log(layer.elements[i]);

      // Is this File denied in past elements? If yes we return the same array for a retry
      if (Object.keys(denied).length && isDenied(denied, layer.elements[i].type, layer.elements[i].fileId)) {
        debugLogs
        ? console.log("DENIED: " + layer.elements[i].type + ":" + layer.elements[i].fileId)
        : null;
        return values;
      }

      // Is this File requested in past elements? If yes we return the same array for a retry
      if (Object.keys(allowed).length && !isAllowed(allowed, layer.elements[i].type, layer.elements[i].fileId)) {
        debugLogs
        ? console.log("NOT ALLOWED: " + layer.elements[i].type + ":" + layer.elements[i].fileId)
        : null;
        return values;
      }

      // Record denies and allows for futur layers
      if (layer.elements[i].denies != undefined && 
          layer.elements[i].denies != '') {

        let rules = layer.elements[i].denies.split(",");
        if (rules.length) {
          for (let j = 0; j < rules.length; j++) {
            let rule = rules[j].split("=");
            let type = rule[0];
            let list = rule[1].split("_");

            // Let's checks if those deny rules are not in conflict with previously selected items
            if (!checkDenyRulesAgainstSelectedElems(type, list, values.selectedElems)) {
              debugLogs
              ? (console.log("DENIED FROM PREVIOUS SELECTION: " + layer.elements[i].type + ":" + layer.elements[i].fileId))
              : null;
              return values;
            }

            // Record those rules for futur elements
            recordExceptions(type, list, denied);

            debugLogs
            ? (console.log("RECORD new DENY exception") && console.log(denied))
            : null;
          }
        }
      }

      // Our new element has some allow rules!
      if (layer.elements[i].allows != undefined && 
          layer.elements[i].allows != '') {

        let rules = layer.elements[i].allows.split(",");
        if (rules.length) {
          for (let j = 0; j < rules.length; j++) {
            let rule = rules[j].split("=");
            let type = rule[0];
            let list = rule[1].split("_");

            // Let's checks if those allow rules are not in conflict with previously selected items
            if (!checkAllowRulesAgainstSelectedElems(type, list, values.selectedElems)) {
              debugLogs
              ? (console.log("NOT ALLOWED FROM PREVIOUS SELECTION: " + layer.elements[i].type + ":" + layer.elements[i].fileId))
              : null;
              return values;
            }

            // Record those rules for futur elements
            recordExceptions(type, list, allowed);

            debugLogs
            ? (console.log("RECORD new ALLOW exception") && console.log(allowed))
            : null;
          }
        }
      }

      // Push layer syntax (id:filename) into the array of selected elements to by drawn 
      values.randNum.push(
        `${layer.elements[i].id}:${layer.elements[i].filename}${
          layer.bypassDNA ? "?bypassDNA=true" : ""
        }`
      );

      // Store the whole selected element for future lookups
      values.selectedElems.push(layer.elements[i]);

      debugLogs
      ? (console.log(JSON.stringify(layer.elements[i])))
      : null;

      return (values);
    }
  }
};

const createDna = (_layers) => {
  let values = {"randNum": [], "selectedElems": []};
  let allowed = {};
  let denied = {};

  let size = 0;
  for (let l = 0; l < _layers.length; l++) {
    debugLogs
    ? console.log((l+1) + " PROCESSING LAYER: " + _layers[l].name)
    : null;
    
    // Loop until we get an appropriate element
    var repeats = 0;
    while (values.randNum.length == size) { 
      if (repeats == 300) {
        console.log(
          `300 retries. Rule failed`
        );
        process.exit();
      }
      values = pickElement(_layers[l], values, allowed, denied);
      repeats++;
      // console.log("Denies: " + denied);
      // console.log("Allows: " + allowed);
    }
    size++;
  }
  
  return values.randNum.join(DNA_DELIMITER);
};

const writeMetaData = (_data) => {
  fs.writeFileSync(`${buildDir}/json/_metadata.json`, _data);
};

const saveMetaDataSingleFile = (_editionCount) => {
  let metadata = metadataList.find((meta) => meta.edition == _editionCount);
  debugLogs
    ? console.log(
        `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
      )
    : null;
  fs.writeFileSync(
    `${buildDir}/json/${_editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes = [];
  for (
    let i = network == NETWORK.sol ? 0 : 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }
  debugLogs
    ? console.log("Editions left to create: ", abstractedIndexes)
    : null;
  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
      let newDna = createDna(layers);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, layers);
        let loadedElements = [];
        let typesDone = {};

        results.forEach((layer) => {
          // Can be multiple types for a layer
          let type = layer.type.split(",");
          let skip = false;
          type.forEach(element => {
            // We already applied this type of trait
            if (typesDone[element] == 1) {
              debugLogs
              ? console.log("TYPE Already applied .. ignoring: " + element)
              : null;
              // Mark this layer for skipping
              skip = true;
              return;
            }

            // Remembering the type we're going to process
            if (layer.selectedElement.name != 'none') {
              typesDone[element] = 1;
            }
          });
          
          // Skipping this layer if flag is true. Because we already processed a similar type.
          if (skip)
            return;

          // Pushing layer
          loadedElements.push(loadLayerImg(layer));

        });

        //console.log(typesDone);

        await Promise.all(loadedElements).then((renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          ctx.clearRect(0, 0, format.width, format.height);
          if (gif.export) {
            hashlipsGiffer = new HashlipsGiffer(
              canvas,
              ctx,
              `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
              gif.repeat,
              gif.quality,
              gif.delay
            );
            hashlipsGiffer.start();
          }
          if (background.generate) {
            drawBackground();
          }
          renderObjectArray.forEach((renderObject, index) => {
            drawElement(
              renderObject,
              index,
              layerConfigurations[layerConfigIndex].layersOrder.length
            );
            if (gif.export) {
              hashlipsGiffer.add();
            }
          });
          if (gif.export) {
            hashlipsGiffer.stop();
          }
          saveImage(abstractedIndexes[0]);
          addMetadata(newDna, abstractedIndexes[0]);
          saveMetaDataSingleFile(abstractedIndexes[0]);
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna
            )}`
          );
          debugLogs
            ? console.log("Editions left to create: ", abstractedIndexes)
            : null;
        });
        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        abstractedIndexes.shift();
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          process.exit();
        }
      }
    }
    layerConfigIndex++;
  }
  writeMetaData(JSON.stringify(metadataList, null, 2));
};

module.exports = { startCreating, buildSetup, getElements };
