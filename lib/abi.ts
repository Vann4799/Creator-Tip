export const TIP_GOAL_ADDRESS = process.env.NEXT_PUBLIC_TIPGOAL_ADDRESS || '0x0000000000000000000000000000000000000000';

export const TIP_GOAL_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "uint256", "name": "_targetAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_deadline", "type": "uint256" }
    ],
    "name": "createGoal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_creator", "type": "address" }
    ],
    "name": "tipCreator",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "closeGoal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_creator", "type": "address" }
    ],
    "name": "getGoal",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "creator", "type": "address" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "targetAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "collectedAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "bool", "name": "goalReached", "type": "bool" }
        ],
        "internalType": "struct TipGoal.Goal",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_creator", "type": "address" }
    ],
    "name": "getTips",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "uint256", "name": "amount", "type": "uint256" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct TipGoal.Tip[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_creator", "type": "address" }
    ],
    "name": "getProgress",
    "outputs": [
      { "internalType": "uint256", "name": "percent", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
