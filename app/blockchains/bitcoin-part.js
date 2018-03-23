var bitcoin = require('bitcoinjs-lib');

var testnet = bitcoin.networks.testnet;

// derive masterkey
var masterKey = bitcoin.HDNode.fromSeedBuffer(Buffer.from('zzzzzzzzzzzzzzzzdffsfsdafafzzzzzzzzzzzzzzaggafafasd'), testnet);
//console.log("masterKey = ", masterKey);

// setup alice & bob, part1 and part2 of the swap
var part1Q = masterKey.derive(0).keyPair;
var part2Q = masterKey.derive(1).keyPair;
// console.log("WIP 1 = ", part1Q.toWIF())
// console.log("WIP 2 = ", part2Q.toWIF())
var part1Address = part1Q.getAddress();
var part2Address = part2Q.getAddress();
console.log("Part1 address = ", part1Address);
console.log("Part2 address = ", part2Address);


let sendMoneyToAddress = part2Address
let redeemScript;

function hashSecret(secret) {
  return bitcoin.crypto.hash160(secret);
}

function createP2SH(secret) {
  let secretHash = hashSecret(secret);

  //OP_HASH160 [HASH SECRET] OP_EQUALVERIFY [PubK] OP_CHECKSIG
  //redeemScript, money can be redeemed by second party
  redeemScript = bitcoin.script.compile([
      bitcoin.opcodes.OP_HASH160,
      secretHash,
      bitcoin.opcodes.OP_EQUALVERIFY,
      part2Q.getPublicKeyBuffer(),
      bitcoin.opcodes.OP_CHECKSIG
  ]);

  //console.log('SCRIPT = ', bitcoin.script.toASM(redeemScript));
  var part1ToPart2ScriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript))
  var part1ToPart2P2SHAddress = bitcoin.address.fromOutputScript(part1ToPart2ScriptPubKey, testnet)

  console.log('send bitcoin to P2SHAddress = ', part1ToPart2P2SHAddress);
}


function redeemBTCFromScript(txid, inputNum, amount, secret) {
  var hashType = bitcoin.Transaction.SIGHASH_ALL

  var txb = new bitcoin.TransactionBuilder(testnet)
  txb.addInput(txid, inputNum)
  txb.addOutput(sendMoneyToAddress, amount)

  console.log("Money will be sent to the address = " + sendMoneyToAddress);

  var txRaw = txb.buildIncomplete()
  var signatureHash = txRaw.hashForSignature(0, redeemScript, hashType)
  console.log("sig hash = " + signatureHash.toString('hex'));
  var redeemScriptSig = bitcoin.script.scriptHash.input.encode([
      part2Q.sign(signatureHash).toScriptSignature(hashType),
      secret
  ], redeemScript);

  // console.log("signature = ", bQ.sign(signatureHash).toScriptSignature(hashType));
  txRaw.setInputScript(0, redeemScriptSig)
  //console.log('SCRIPT AGAIN = ', bitcoin.script.toASM(redeemScriptSig));
  console.log("raw transaction hex = " + txRaw.toHex());
}

//createP2SH();
//redeemBTCFromScript('81449b5125ce9df7a8846bda46f1655566d012e65e73c3da2bb07c1445879dac', 1, 1000)



module.exports = {
  hashSecret: hashSecret,
  createP2SH: createP2SH,
  redeemBTCFromScript: redeemBTCFromScript
}
