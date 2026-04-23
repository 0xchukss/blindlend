import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployer } = await hre.getNamedAccounts();
  await hre.deployments.deploy("ConfidentialLend", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
};

deploy.tags = ["ConfidentialLend"];
export default deploy;
