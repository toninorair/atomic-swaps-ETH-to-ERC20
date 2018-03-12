
function printNewContractInfo(log) {
  console.log("================ New Contract was created ================")
  console.log("Log event = ", log.event);

  Object.keys(log.args).forEach(function(key, index) {
    console.log(`${key} = ${log.args[key] instanceof Number ?
      log.args[key].toNumber(): log.args[key]}`)
   });

  console.log("==========================================================")
}

module.exports.printNewContractInfo = printNewContractInfo
