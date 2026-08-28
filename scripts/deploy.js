const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const GANACHE_PORTS = [7545, 8545];

async function deploy() {
  console.log('========================================');
  console.log('   区块链投票系统 - 合约部署工具');
  console.log('========================================\n');

  const args = process.argv.slice(2);
  const portIndex = args.indexOf('--port');
  const specifiedPort = portIndex !== -1 ? parseInt(args[portIndex + 1]) : null;

  let web3 = null;
  let connectedPort = null;

  const portsToTry = specifiedPort ? [specifiedPort] : GANACHE_PORTS;

  for (const port of portsToTry) {
    try {
      const rpc = `http://127.0.0.1:${port}`;
      console.log(`尝试连接 Ganache (端口 ${port})...`);
      const tempWeb3 = new Web3(rpc);
      const netId = await tempWeb3.eth.net.getId();
      console.log(`✓ 连接成功! 网络 ID: ${netId}`);
      web3 = tempWeb3;
      connectedPort = port;
      break;
    } catch (e) {
      console.log(`  ✗ 端口 ${port} 不可用`);
    }
  }

  if (!web3) {
    console.error('\n❌ 无法连接到 Ganache。请确保 Ganache 正在运行 (默认端口: 7545 或 8545)');
    console.error('   使用 --port 指定端口，例如: node scripts/deploy.js --port 7545');
    process.exit(1);
  }

  console.log('');

  const accounts = await web3.eth.getAccounts();
  if (accounts.length === 0) {
    console.error('❌ Ganache 中没有账户');
    process.exit(1);
  }

  console.log(`可用账户: ${accounts.length} 个`);
  console.log(`部署账户: ${accounts[0]}`);
  console.log(`账户余额: ${web3.utils.fromWei(await web3.eth.getBalance(accounts[0]), 'ether')} ETH\n`);

  const buildPath = path.join(__dirname, '..', 'build', 'contracts', 'Voting.json');
  if (!fs.existsSync(buildPath)) {
    console.error('❌ 未找到编译后的合约文件。请先运行 npm run compile');
    console.error('   或者运行: npx truffle compile');
    process.exit(1);
  }

  const contractData = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
  const abi = contractData.abi;
  const bytecode = contractData.bytecode;

  console.log('正在部署 Voting 合约...\n');

  try {
    const contract = new web3.eth.Contract(abi);
    const deployTx = contract.deploy({ data: bytecode });

    const estimatedGas = await deployTx.estimateGas({ from: accounts[0] });
    const gasLimit = Math.floor(Number(estimatedGas) * 1.2);

    console.log(`预估 Gas: ${estimatedGas}`);
    console.log(`实际 Gas Limit: ${gasLimit}\n`);

    const deployed = await deployTx.send({
      from: accounts[0],
      gas: gasLimit,
      gasPrice: '20000000000'
    });

    console.log('='.repeat(60));
    console.log('  ✅ 合约部署成功!');
    console.log('='.repeat(60));
    console.log(`  合约地址: ${deployed.options.address}`);
    console.log(`  交易哈希: ${deployed.transactionHash}`);
    console.log(`  区块高度: ${deployed.blockNumber}`);
    console.log(`  Gas 消耗: ${deployed.gasUsed}`);
    console.log('='.repeat(60));
    console.log('  部署者 (admin):', accounts[0]);
    console.log('='.repeat(60) + '\n');

    const networkId = await web3.eth.net.getId();

    const contractJson = {
      contractName: 'Voting',
      abi: abi,
      bytecode: bytecode,
      networks: {
        [networkId]: {
          events: {},
          links: {},
          address: deployed.options.address,
          transactionHash: deployed.transactionHash
        }
      }
    };

    const srcJsDir = path.join(__dirname, '..', 'src', 'js');
    if (!fs.existsSync(srcJsDir)) {
      fs.mkdirSync(srcJsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(srcJsDir, 'Voting.json'),
      JSON.stringify(contractJson, null, 2)
    );
    console.log('✅ 已更新 src/js/Voting.json');

    fs.writeFileSync(
      path.join(__dirname, '..', 'build', 'contracts', 'Voting.json'),
      JSON.stringify(contractJson, null, 2)
    );
    console.log('✅ 已更新 build/contracts/Voting.json\n');

    console.log('接下来你可以:');
    console.log('  1. 运行 npm start 启动前端服务器');
    console.log('  2. 在浏览器中打开 http://localhost:3000');
    console.log('  3. 用 MetaMask 连接 Ganache 网络');
    console.log(`  4. 将部署账户 ${accounts[0].substring(0, 12)}... 导入 MetaMask 作为管理员\n`);

  } catch (err) {
    console.error('\n❌ 部署失败:', err.message || err);
    process.exit(1);
  }
}

deploy();