
function printNewContractInfo(log) {
  console.log("================ New Contract was created ================")
  console.log("Log event = ", log.event);

  Object.keys(log.args).forEach(function(key, index) {
    console.log(`${key} = ${log.args[key] instanceof Number ?
      log.args[key].toNumber(): log.args[key]}`)
   });

  console.log("==========================================================")
}

function getTimelock(isSecretOwner) {
     return isSecretOwner ?
         Date.now() / 1000 + 24 * 60 * 60 :
         Date.now() / 1000 + 12 * 60 * 60;
}

module.exports.printNewContractInfo = printNewContractInfo
module.exports.getTimelock = getTimelock
