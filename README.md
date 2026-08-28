# 去中心化投票 DApp

基于以太坊智能合约的去中心化投票应用，支持管理员与普通用户双角色体系，实现投票项目管理、注册码验证、防重复投票、时间窗口控制、实时结果查看、消息通知等完整功能。

## 功能特点

### 核心功能
- 去中心化投票：基于以太坊智能合约，投票数据不可篡改
- 管理员面板：设置投票项目、添加候选人、生成注册码、发送通知
- 用户界面：注册、投票、查看结果、接收通知
- 注册码机制：防止恶意注册，确保投票资格
- 投票时间控制：设定投票开始和结束时间

### 安全特性
- 防重复投票：每个地址只能投票一次
- 防重复候选人：防止添加重复候选人
- 注册码验证：使用后立即失效
- 权限控制：仅管理员可操作管理功能（onlyAdmin）
- 时间窗口控制：投票仅在指定时间段内进行（duringVotingPeriod）

## 技术栈

| 层 | 技术 |
|----|------|
| 智能合约 | Solidity 0.8.19 |
| 开发框架 | Truffle |
| 前端 | HTML/CSS/JavaScript + Web3.js |
| 后端 | Node.js + Express |
| 测试网络 | Ganache |

## 项目结构

```
voting-dapp/
├── contracts/
│   └── Voting.sol              # 投票智能合约
├── migrations/
│   └── 1_initial_migration.js  # Truffle迁移脚本
├── build/
│   └── contracts/
│       └── Voting.json         # 合约ABI与地址
├── scripts/
│   └── deploy.js               # 部署脚本
├── src/
│   ├── index.html             # 前端页面
│   ├── server.js              # Express服务器
│   └── js/
│       ├── index.js            # 前端逻辑（合约交互）
│       └── Voting.json         # 合约ABI
├── truffle-config.js           # Truffle配置
├── package.json                # 项目依赖
└── README.md
```

## 快速开始

### 前置要求
- Node.js v14+
- Truffle (`npm install -g truffle`)
- Ganache（本地以太坊测试网络）

### 安装与部署

1. 启动 Ganache，确保 RPC 运行在 `http://127.0.0.1:7545`

2. 安装依赖
```bash
npm install
```

3. 编译合约
```bash
truffle compile
```

4. 部署合约
```bash
truffle migrate --reset
```

5. 复制合约 ABI
```bash
cp build/contracts/Voting.json src/js/Voting.json
```

6. 启动应用
```bash
npm run dev
```

7. 访问 `http://localhost:3001`

## 智能合约核心函数

| 函数 | 说明 |
|------|------|
| `setVotingProject()` | 设置投票项目名称与时间（仅管理员） |
| `addCandidate()` | 添加候选人（仅管理员） |
| `generateRegistrationCode()` | 生成注册码（仅管理员） |
| `register()` | 用户注册（需有效注册码） |
| `vote()` | 投票（仅注册用户，投票时间内） |
| `getCandidateVoteCount()` | 查询候选人票数 |
| `getAllCandidates()` | 获取全部候选人列表 |

## 使用流程

### 管理员
1. 选择 Ganache 账户1（部署合约的账户）
2. 设置投票项目名称和时间
3. 添加候选人
4. 生成注册码并分发给用户

### 投票用户
1. 选择其他 Ganache 账户
2. 输入注册码完成注册
3. 在投票时间内选择候选人投票
4. 查看实时投票结果

## License

MIT
