const basePath = process.cwd();
const { MODE } = require(`${basePath}/constants/blend_mode.js`);
const { NETWORK } = require(`${basePath}/constants/network.js`);

const network = NETWORK.eth;

// General metadata for Ethereum
const namePrefix = "Fry Heads";
const description = "NFT from a parallel universe helping to raise money for charity in perpetuity.";
// CID for images
const baseUri = "ipfs://QmSrkHWoPqz6EXZtg5PVS3BE6SY4Dxz5QudNNdVstQwUcb";

const solanaMetadata = {
  symbol: "YC",
  seller_fee_basis_points: 0, // Define how much % you want from secondary market sales 1000 = 10%
  external_url: "https://www.youtube.com/c/hashlipsnft",
  creators: [
    {
      address: "7fXNuer5sbZtaTEPhtJ5g5gNtuyRoKkvxdjEjEnPN4mC",
      share: 0,
    },
  ],
};

// If you have selected Solana then the collection starts from 0 automatically
const layerConfigurations = [
  {
    growEditionSizeTo: 1000,
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
      { name: "13 Eye - Under Hat",
        type: "Eye", 
        options: {
          displayName: "Special Eyes",
        }
      },
      { name: "12 Mouth - Under Hat",
        type: "Mouth", 
        options: {
          displayName: "Special Mouth 2",
        }
      },
      { name: "11 Hat & Eye - Without Ears & Hat & nose",
        type: "Eye", 
        options: {
          displayName: "Special Hat",
        }
      },
      { name: "10 Hat - With Hair",
        type: "Hat", 
        options: {
          displayName: "Special Hair",
        }
      },
      { name: "09 Hat",
        type: "Hat", 
        options: {
          displayName: "Hat",
        }
      },
      { name: "08 Ear",
        type: "Ear", 
        options: {
          displayName: "Ear",
        }
      },
      { name: "07 Mouth",
        type: "Mouth", 
        options: {
          displayName: "Mouth",
        }
      },
      { name: "06 Mustache",
        type: "Mustache", 
        options: {
          displayName: "Mustache",
        }
      },
      { name: "05 Eye",
        type: "Eye", 
        options: {
          displayName: "Eye",
        }
      },
      { name: "04 Eye Glasses",
        type: "Eye", 
        options: {
          displayName: "Eye Glasses",
        }
      },
      { name: "03bis Mouth Over Eyes",
        type: "Mouth", 
        options: {
          displayName: "Special Mouth",
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
          displayName: "Nose",
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
  width: 1024,
  height: 1024,
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
  external_url: "https://fryheads.com"
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
