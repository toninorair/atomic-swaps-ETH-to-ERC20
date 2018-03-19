# atomic-swaps-ETH-to-ERC20

atomic swap between ETH and ERC20 tokens

# deploy & run
1. Install dependencies
```
$ npm install
```
2. Run blockchain, for example 
```
$ testrpc
```
3. Compile and deploy your smart contracts
```
  $ truffle compile --all
  $ truffle migrate --reset --network dev
```
4. Run atomic swap 
```
  $ node app/run.js
```
