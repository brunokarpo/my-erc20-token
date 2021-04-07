const BrunoShare = artifacts.require("BrunoShare");

module.exports = function (deployer) {
  deployer.deploy(BrunoShare, 1000, 'Bruno Coin', 0, 'BRC', "1000000000000000000");
};
