const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);
const { NETWORK } = require(`${basePath}/constants/network.js`);

const network = NETWORK.eth;

// General metadata for Ethereum
const namePrefix = "Fry Heads";
const description = "Fries from another universe";
const baseUri = "ipfs://QmXgGkWXWoFADKfoNc1S48Z6hRqJrRBcBNVabTSCd66gSR";

const solanaMetadata = {
  symbol: "YC",
  seller_fee_basis_points: 1000, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.youtube.com/c/hashlipsnft",
  creators: [
    {
      address: "7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",
      share: 100,
    },
  ],
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 50,
    layersOrder: [
      { name: "16 Background",
        type: "Background", 
        options: {
          displayName: "Background",
          bypassDNA: true
        }
      },
      { name: "15 Body",
        type: "Body", 
        options: {
          displayName: "Body",
          bypassDNA: true
        }
      },
      { name: "14 Clothes",
        type: "Clothes", 
        options: {
          displayName: "Clothes",
        }
      },
      { name: "13 Eye Under Hat",
        type: "Eye", 
        options: {
          displayName: "Eyes Under Hat",
        }
      },
      { name: "12 Mouth Under Hat",
        type: "Mouth", 
        options: {
          displayName: "Mouth Under Hat",
        }
      },
      { name: "11 Hat Without ears & hat",
        type: "Hat", 
        options: {
          displayName: "Hat Without Ears & Tops",
        }
      },
      { name: "10 Hair With hat",
        type: "Hat", 
        options: {
          displayName: "Hair With Hat",
        }
      },
      { name: "09 Hat",
        type: "Hat", 
        options: {
          displayName: "Hat",
        }
      },
      { name: "08 Mouth",
        type: "Mouth", 
        options: {
          displayName: "Mouth",
        }
      },
      { name: "07 Mustache",
        type: "Mustache", 
        options: {
          displayName: "Mustache",
        }
      },
      { name: "06 Eye",
        type: "Eye", 
        options: {
          displayName: "Eye",
        }
      },
      { name: "05 Ear",
        type: "Ear", 
        options: {
          displayName: "Ear",
        }
      },
      { name: "04 Eye Glasses",
        type: "Eye", 
        options: {
          displayName: "Eye Glasses",
        }
      },
      { name: "03 Hat Cap",
        type: "Hat", 
        options: {
          displayName: "Cap",
        }
      },
      { name: "02 Nose",
        type: "Nose", 
        options: {
          displayName: "Noze",
        }
      },
      { name: "01 Hat Helmet",
        type: "Hat", 
        options: {
          displayName: "Helmet",
        }
      },
    ],
  },
];

const shuffleLayerConfigurations = false;

const debugLogs = true;

const format = {
  width: 512,
  height: 512,
  smoothing: false,
};

const gif = {
  export: false,
  repeat: 0,
  quality: 100,
  delay: 500,
};

const text = {
  only: false,
  color: "#ffffff",
  size: 20,
  xGap: 40,
  yGap: 40,
  align: "left",
  baseline: "top",
  weight: "regular",
  family: "Courier",
  spacer: " => ",
};

const pixelFormat = {
  ratio: 5 / 128,
};

const background = {
  generate: true,
  brightness: "80%",
  static: false,
  default: "#000000",
};

const extraMetadata = {
  external_url: "https://stickhumans.com"
};

const rarityDelimiter = "#";

const uniqueDnaTorrance = 10000;

const preview = {
  thumbPerRow: 5,
  thumbWidth: 50,
  imageRatio: format.height / format.width,
  imageName: "preview.png",
};

const preview_gif = {
  numberOfImages: 5,
  order: "ASC", // ASC, DESC, MIXED
  repeat: 0,
  quality: 100,
  delay: 500,
  imageName: "preview.gif",
};

module.exports = {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  pixelFormat,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
  preview_gif,
};
