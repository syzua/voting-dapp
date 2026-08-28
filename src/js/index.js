let web3;
let contract;
let currentAccount;
let contractAddress;
let contractNetworkId;
let walletType = null;
let generatedCodes = [];

const GANACHE_RPC = 'http://127.0.0.1:7545';
const GANACHE_ALT_RPC = 'http://127.0.0.1:7545';
const TARGET_NETWORK_IDS = [1337, 5777, 31337];
const TARGET_CHAIN_IDS = ['0x539', '0x1691', '0x7a69'];

function showNotification(message, type) {
    type = type || 'info';
    var alertClass = 'alert-info';
    if (type === 'success') alertClass = 'alert-success';
    if (type === 'warning') alertClass = 'alert-warning';
    if (type === 'danger') alertClass = 'alert-danger';

    var el = document.createElement('div');
    el.className = 'alert ' + alertClass + ' alert-dismissible fade show';
    el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;max-width:420px;box-shadow:0 8px 30px rgba(0,0,0,0.2);';
    el.innerHTML = '<strong>' + message + '</strong><button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 6000);
}

function showSpinner() {
    var s = document.getElementById('spinner');
    if (s) s.classList.add('show');
}

function hideSpinner() {
    var s = document.getElementById('spinner');
    if (s) s.classList.remove('show');
}

function showPage(pageId) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
    var page = document.getElementById(pageId);
    if (page) page.classList.add('active');
}

function updateStatusBar() {
    var bar = document.getElementById('statusBar');
    var displayChainId = document.getElementById('displayChainId');
    var displayNetwork = document.getElementById('displayNetwork');
    var displayContract = document.getElementById('displayContract');
    var displayAccount = document.getElementById('displayAccount');

    if (!bar) return;
    bar.style.display = 'block';

    if (displayAccount) displayAccount.textContent = currentAccount ? currentAccount.substring(0, 10) + '...' : '--';
    if (displayContract) displayContract.textContent = contractAddress ? contractAddress.substring(0, 8) + '...' : '--';

    if (displayNetwork && walletType) {
        displayNetwork.textContent = walletType === 'metamask' ? 'MetaMask' : 'Ganache';
    }

    if (displayChainId && contractNetworkId) {
        displayChainId.textContent = contractNetworkId;
    }
}

function resetApp() {
    web3 = null;
    contract = null;
    currentAccount = null;
    contractAddress = null;
    walletType = null;
    generatedCodes = [];
    showPage('walletPage');

    var bar = document.getElementById('statusBar');
    var ganacheSection = document.getElementById('ganacheSection');
    var ganacheStatus = document.getElementById('ganacheStatus');
    var metamaskStatus = document.getElementById('metamaskStatus');

    if (bar) bar.style.display = 'none';
    if (ganacheSection) ganacheSection.style.display = 'none';
    if (ganacheStatus) ganacheStatus.innerHTML = '<span class="badge bg-secondary">未连接</span>';
    if (metamaskStatus) metamaskStatus.innerHTML = '<span class="badge bg-secondary">未连接</span>';
}

function logout() {
    resetApp();
    showNotification('已退出登录', 'info');
}

function switchAdminTab(event, tabId) {
    event.preventDefault();
    var links = document.querySelectorAll('#adminPage .nav-link');
    for (var i = 0; i < links.length; i++) links[i].classList.remove('active');
    event.target.classList.add('active');

    var tabs = document.querySelectorAll('.admin-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].style.display = 'none';

    var target = document.getElementById('admin' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    if (target) target.style.display = 'block';

    if (tabId === 'init') { loadCandidates(); loadAdminVotes(); }
    if (tabId === 'notifications') loadAdminNotifications();
    if (tabId === 'results') loadAdminResults();
}

function switchUserTab(event, tabId) {
    event.preventDefault();
    var links = document.querySelectorAll('#userPage .nav-link');
    for (var i = 0; i < links.length; i++) links[i].classList.remove('active');
    event.target.classList.add('active');

    var tabs = document.querySelectorAll('.user-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].style.display = 'none';

    var target = document.getElementById('user' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
    if (target) target.style.display = 'block';

    if (tabId === 'vote') loadUserVote();
    if (tabId === 'notifications') loadUserNotifications();
    if (tabId === 'results') loadUserResults();
}

function connectGanache() {
    console.log('[Connect] 点击连接 Ganache');
    showSpinner();
    var ganacheStatus = document.getElementById('ganacheStatus');

    if (typeof Web3 === 'undefined') {
        hideSpinner();
        alert('Web3 未加载！请刷新页面');
        return;
    }

    tryConnectGanache(GANACHE_RPC)
        .then(function (result) {
            console.log('[Connect] 尝试端口 7545 结果:', !!result);
            if (result) return result;
            return tryConnectGanache(GANACHE_ALT_RPC);
        })
        .then(function (result) {
            console.log('[Connect] 最终结果:', !!result);
            if (!result) {
                hideSpinner();
                if (ganacheStatus) ganacheStatus.innerHTML = '<span class="badge bg-warning">连接失败</span>';
                alert('无法连接到 Ganache。\n请确保 Ganache 正在运行 (默认端口: 7545)\n\n或者，点击 MetaMask 连接！');
                return;
            }
            web3 = result.web3;
            walletType = 'ganache';
            if (ganacheStatus) ganacheStatus.innerHTML = '<span class="badge bg-success">已连接</span>';

            var accounts = result.accounts;
            console.log('[Connect] 获取账户:', accounts);
            var select = document.getElementById('ganacheAccount');
            select.innerHTML = '<option value="">-- 选择账户 --</option>';
            for (var i = 0; i < accounts.length; i++) {
                select.innerHTML += '<option value="' + i + '">账户 ' + (i + 1) + ': ' + accounts[i].substring(0, 15) + '...</option>';
            }
            document.getElementById('ganacheSection').style.display = 'block';
            hideSpinner();
        })
        .catch(function (err) {
            console.error('[Connect] 错误:', err);
            hideSpinner();
            if (ganacheStatus) ganacheStatus.innerHTML = '<span class="badge bg-warning">连接失败</span>';
            alert('连接 Ganache 失败: ' + (err.message || err));
        });
}

function tryConnectGanache(rpcUrl) {
    console.log('[TryConnect] 尝试连接:', rpcUrl);
    return new Promise(function (resolve) {
        try {
            var w3 = new Web3(rpcUrl);
            console.log('[TryConnect] Web3 实例创建成功');
            
            w3.eth.getAccounts()
                .then(function (accounts) {
                    console.log('[TryConnect] 获取账户:', accounts);
                    if (accounts && accounts.length > 0) {
                        resolve({ web3: w3, accounts: accounts });
                    } else {
                        console.log('[TryConnect] 无账户');
                        resolve(null);
                    }
                })
                .catch(function (err) {
                    console.log('[TryConnect] 错误:', err);
                    resolve(null);
                });
        } catch (e) {
            console.log('[TryConnect] 异常:', e);
            resolve(null);
        }
    });
}

function confirmGanacheAccount() {
    var index = document.getElementById('ganacheAccount').value;
    if (index === '') {
        alert('请先选择一个账户');
        return;
    }
    showSpinner();
    web3.eth.getAccounts()
        .then(function (accounts) {
            currentAccount = accounts[index];
            var cad = document.getElementById('currentAccountDisplay');
            if (cad) cad.textContent = currentAccount;
            return loadContractInfo();
        })
        .then(function () {
            return checkAndLogin();
        })
        .then(function () {
            updateStatusBar();
            hideSpinner();
        })
        .catch(function (err) {
            hideSpinner();
            console.error(err);
            alert('连接失败: ' + (err.message || err));
        });
}

function connectMetaMask() {
    console.log('[MetaMask] 开始连接...');

    if (typeof window.ethereum === 'undefined') {
        alert('请先安装 MetaMask 浏览器插件！\n\n下载地址: https://metamask.io');
        return;
    }

    showSpinner();
    var metamaskStatus = document.getElementById('metamaskStatus');

    Promise.race([
        window.ethereum.request({ method: 'eth_chainId' }),
        new Promise(function(resolve, reject) {
            setTimeout(function() { reject(new Error('TIMEOUT')); }, 10000);
        })
    ])
        .then(function (chainId) {
            var numericChainId = parseInt(chainId, 16);
            console.log('[MetaMask] 当前链 ID:', numericChainId);

            if (TARGET_NETWORK_IDS.indexOf(numericChainId) === -1) {
                showNotification('请确保 MetaMask 已连接到 Ganache 网络', 'warning');
                return Promise.race([
                    switchToGanacheNetwork(),
                    new Promise(function(resolve, reject) {
                        setTimeout(function() { reject(new Error('NETWORK_TIMEOUT')); }, 15000);
                    })
                ]);
            }
            return true;
        })
        .then(function (switched) {
            if (!switched) {
                throw new Error('NETWORK_SWITCH_FAILED');
            }
            return Promise.race([
                window.ethereum.request({ method: 'eth_requestAccounts' }),
                new Promise(function(resolve, reject) {
                    setTimeout(function() { reject(new Error('ACCOUNT_TIMEOUT')); }, 10000);
                })
            ]);
        })
        .then(function (accounts) {
            if (!accounts || accounts.length === 0) {
                throw new Error('NO_ACCOUNTS');
            }
            console.log('[MetaMask] 获取账户:', accounts[0]);

            walletType = 'metamask';
            currentAccount = accounts[0];
            web3 = new Web3(window.ethereum);

            if (metamaskStatus) metamaskStatus.innerHTML = '<span class="badge bg-success">已连接</span>';
            var cad = document.getElementById('currentAccountDisplay');
            if (cad) cad.textContent = currentAccount;

            setupMetaMaskListeners();
            return loadContractInfo();
        })
        .then(function () {
            return checkAndLogin();
        })
        .then(function () {
            updateStatusBar();
            hideSpinner();
        })
        .catch(function (err) {
            hideSpinner();
            console.error('[MetaMask] 连接失败:', err);

            if (err.code === 4001) {
                alert('您拒绝了连接请求');
            } else if (err.message === 'NETWORK_SWITCH_FAILED' || err.message === 'NETWORK_TIMEOUT') {
                alert('网络切换失败，请手动在 MetaMask 中配置 Ganache 网络:\n\n网络名称: Ganache Local\nRPC URL: http://127.0.0.1:7545\n链 ID: 5777\n货币符号: ETH');
            } else if (err.message === 'ACCOUNT_TIMEOUT') {
                alert('连接超时，请重试或检查 MetaMask 连接');
            } else if (err.message === 'TIMEOUT') {
                alert('网络请求超时，请确保 MetaMask 已正确连接');
            } else if (err.message === 'NO_ACCOUNTS') {
                alert('MetaMask 中未找到账户，请确保 MetaMask 已解锁');
            } else if (err.message && err.message.includes('aborted')) {
                alert('连接被中断，请重试连接\n\n建议：先使用 Ganache 连接方式测试');
            } else {
                alert('连接 MetaMask 失败: ' + (err.message || '未知错误') + '\n\n建议尝试 Ganache 直接连接');
            }
        });
}

function switchToGanacheNetwork() {
    return window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1691' }]
    }).catch(function (switchError) {
        if (switchError.code === 4902) {
            return window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: '0x1691',
                    chainName: 'Ganache Local',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [GANACHE_RPC],
                    blockExplorerUrls: null
                }]
            });
        }
        throw switchError;
    });
}

function setupMetaMaskListeners() {
    if (typeof window.ethereum === 'undefined') return;

    window.ethereum.on('accountsChanged', function (accounts) {
        console.log('[MetaMask] 账户变化:', accounts);
        if (!accounts || accounts.length === 0) {
            resetApp();
        } else if (accounts[0].toLowerCase() !== (currentAccount || '').toLowerCase()) {
            currentAccount = accounts[0];
            updateStatusBar();
            var cad = document.getElementById('currentAccountDisplay');
            if (cad) cad.textContent = currentAccount;
            if (contract) checkAndLogin();
        }
    });

    window.ethereum.on('chainChanged', function (chainId) {
        console.log('[MetaMask] 网络变化:', chainId);
        var numericChainId = parseInt(chainId, 16);
        if (TARGET_NETWORK_IDS.indexOf(numericChainId) === -1) {
            showNotification('请切换到 Ganache 网络 (链ID: 5777)', 'warning');
        } else {
            window.location.reload();
        }
    });

    window.ethereum.on('disconnect', function () {
        console.log('[MetaMask] 断开连接');
        resetApp();
    });
}

function loadContractInfo() {
    console.log('[合约] 加载合约文件...');

    return fetch('js/Voting.json')
        .then(function (response) {
            if (!response.ok) throw new Error('合约文件加载失败 (HTTP ' + response.status + ')');
            return response.json();
        })
        .then(function (data) {
            if (!data.abi || !data.networks) {
                throw new Error('合约文件格式不正确，请重新部署合约');
            }

            var chainId = TARGET_NETWORK_IDS[0];
            var networkKeys = Object.keys(data.networks);

            for (var i = 0; i < TARGET_NETWORK_IDS.length; i++) {
                if (data.networks[TARGET_NETWORK_IDS[i]]) {
                    chainId = TARGET_NETWORK_IDS[i];
                    break;
                }
            }

            for (var j = 0; j < networkKeys.length; j++) {
                if (data.networks[networkKeys[j]]) {
                    chainId = parseInt(networkKeys[j]);
                    break;
                }
            }

            contractAddress = data.networks[chainId].address;
            contractNetworkId = chainId;

            console.log('[合约] 地址:', contractAddress);
            console.log('[合约] 网络ID:', contractNetworkId);

            contract = new web3.eth.Contract(data.abi, contractAddress);
            console.log('[合约] 加载完成');
        })
        .catch(function (err) {
            console.error('[合约] 加载失败:', err);
            throw err;
        });
}

function checkAndLogin() {
    if (!contract || !currentAccount) return Promise.resolve();

    console.log('[身份] 检查账户身份...');
    return contract.methods.isAdmin(currentAccount)
        .call()
        .then(function (isAdmin) {
            console.log('[身份] 是否管理员:', isAdmin);

            if (isAdmin) {
                showPage('adminPage');
                var cad = document.getElementById('currentAccountDisplay');
                if (cad) cad.textContent = currentAccount;
                loadCandidates();
                loadAdminVotes();
                loadAdminNotifications();
                loadAdminResults();
                updateCodeList();
            } else {
                showPage('userPage');
                var uad = document.getElementById('userAccountDisplay');
                if (uad) uad.textContent = currentAccount;
                checkRegistration();
                loadUserNotifications();
                loadUserResults();
            }
        })
        .catch(function (err) {
            console.error('[身份] 检查失败:', err);
            alert('检查身份失败: ' + (err.message || '未知错误'));
        });
}

function setProject() {
    var name = document.getElementById('projectName').value.trim();
    var startVal = document.getElementById('startTime').value;
    var endVal = document.getElementById('endTime').value;

    if (!name || !startVal || !endVal) { alert('请填写完整的项目信息'); return; }

    var start = Math.floor(new Date(startVal).getTime() / 1000);
    var end = Math.floor(new Date(endVal).getTime() / 1000);
    if (end <= start) { alert('结束时间必须晚于开始时间'); return; }

    showSpinner();
    if (walletType === 'metamask') showNotification('请在 MetaMask 中确认交易', 'info');

    contract.methods.setVotingProject(name, start, end).send({ from: currentAccount, gas: 3000000 })
        .then(function (receipt) {
            hideSpinner();
            showNotification('项目设置成功！交易已确认 ✓', 'success');
            alert('项目 "' + name + '" 已成功设置！\n\n交易已确认！\n区块: ' + receipt.blockNumber);
        })
        .catch(function (err) {
            hideSpinner();
            if (err.code === 4001) { alert('您取消了交易'); return; }
            alert('设置失败: ' + (err.message || err));
        });
}

function addCandidate() {
    var name = document.getElementById('candidateName').value.trim();
    if (!name) { alert('请输入候选人姓名'); return; }

    showSpinner();
    if (walletType === 'metamask') showNotification('请在 MetaMask 中确认交易', 'info');

    contract.methods.addCandidate(name).send({ from: currentAccount, gas: 3000000 })
        .then(function (receipt) {
            document.getElementById('candidateName').value = '';
            loadCandidates();
            loadAdminVotes();
            loadAdminResults();
            hideSpinner();
            showNotification('候选人添加成功！交易已确认 ✓', 'success');
        })
        .catch(function (err) {
            hideSpinner();
            if (err.code === 4001) { alert('您取消了交易'); return; }
            alert('添加失败: ' + (err.message || err));
        });
}

function loadCandidates() {
    if (!contract) return;
    contract.methods.getResults().call()
        .then(function (result) {
            var list = document.getElementById('candidateList');
            if (!list) return;
            var candidates = result[0];
            if (!candidates || candidates.length === 0) {
                list.innerHTML = '<p class="text-muted">暂无候选人</p>';
                return;
            }
            var html = '<div class="list-group">';
            for (var i = 0; i < candidates.length; i++) {
                html += '<div class="list-group-item d-flex justify-content-between align-items-center">' +
                    '<span><strong>' + (i + 1) + '.</strong> ' + candidates[i] + '</span>' +
                    '<span class="badge bg-primary rounded-pill">' + (result[1][i] || 0) + ' 票</span></div>';
            }
            html += '</div>';
            list.innerHTML = html;
        });
}

function loadAdminVotes() {
    if (!contract) return;
    contract.methods.getResults().call()
        .then(function (result) {
            var el = document.getElementById('adminVoteResults');
            if (!el) return;
            var candidates = result[0];
            var votes = result[1];
            if (!candidates || candidates.length === 0) {
                el.innerHTML = '<div class="alert alert-info">暂无数据</div>';
                return;
            }
            var html = '<div class="list-group">';
            for (var i = 0; i < candidates.length; i++) {
                html += '<div class="list-group-item d-flex justify-content-between align-items-center">' +
                    '<span>' + candidates[i] + '</span>' +
                    '<span class="badge bg-info">' + (votes[i] || 0) + ' 票</span></div>';
            }
            html += '</div>';
            el.innerHTML = html;
        });
}

function generateRandomCode() {
    var code = 'VOTE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    generateCode(code);
}

function generateManualCode() {
    var code = document.getElementById('manualCode').value.trim();
    if (!code) { alert('请输入注册码'); return; }
    generateCode(code);
}

function generateCode(code) {
    showSpinner();
    if (walletType === 'metamask') showNotification('请在 MetaMask 中确认交易', 'info');

    contract.methods.generateRegistrationCode(code).send({ from: currentAccount, gas: 3000000 })
        .then(function (receipt) {
            generatedCodes.push(code);
            var mc = document.getElementById('manualCode');
            if (mc) mc.value = '';
            updateCodeList();
            hideSpinner();
            showNotification('注册码已保存到区块链！交易已确认 ✓', 'success');
            alert('注册码已保存！\n\n注册码: ' + code + '\n\n交易已确认！\n区块: ' + receipt.blockNumber);
        })
        .catch(function (err) {
            hideSpinner();
            if (err.code === 4001) { alert('您取消了交易'); return; }
            alert('生成失败: ' + (err.message || err));
        });
}

function updateCodeList() {
    var list = document.getElementById('codeList');
    if (!list) return;
    if (generatedCodes.length === 0) {
        list.innerHTML = '<p class="text-muted">暂无注册码</p>';
        return;
    }
    var html = '<ul class="list-group">';
    for (var i = 0; i < generatedCodes.length; i++) {
        html += '<li class="list-group-item"><strong>' + (i + 1) + '.</strong> ' + generatedCodes[i] + '</li>';
    }
    html += '</ul>';
    list.innerHTML = html;
}

function sendNotification() {
    var msg = document.getElementById('notificationMsg').value;
    if (!msg) { alert('请输入通知内容'); return; }

    showSpinner();
    if (walletType === 'metamask') showNotification('请在 MetaMask 中确认交易', 'info');

    contract.methods.sendNotification(msg).send({ from: currentAccount, gas: 3000000 })
        .then(function (receipt) {
            document.getElementById('notificationMsg').value = '';
            loadAdminNotifications();
            hideSpinner();
            showNotification('通知发送成功！交易已确认 ✓', 'success');
        })
        .catch(function (err) {
            hideSpinner();
            if (err.code === 4001) { alert('您取消了交易'); return; }
            alert('发送失败: ' + (err.message || err));
        });
}

function loadAdminNotifications() {
    if (!contract) return;
    
    contract.methods.getNotificationCount().call()
        .then(function(count) {
            var el = document.getElementById('notificationHistory');
            if (!el) return;
            
            if (count === 0 || count === '0') {
                el.innerHTML = '<p class="text-muted">暂无通知</p>';
                return;
            }
            
            var notifications = [];
            var fetched = 0;
            
            for (var i = 0; i < count; i++) {
                (function(index) {
                    contract.methods.notifications(index).call()
                        .then(function(n) {
                            notifications[index] = n;
                            fetched++;
                            if (fetched >= count) {
                                var html = '<ul class="list-group">';
                                for (var j = 0; j < notifications.length; j++) {
                                    html += '<li class="list-group-item">' + (j + 1) + '. ' + notifications[j] + '</li>';
                                }
                                html += '</ul>';
                                el.innerHTML = html;
                            }
                        })
                        .catch(function() {
                            fetched++;
                            if (fetched >= count) {
                                el.innerHTML = '<p class="text-muted">加载通知失败</p>';
                            }
                        });
                })(i);
            }
        })
        .catch(function() {
            var el = document.getElementById('notificationHistory');
            if (el) el.innerHTML = '<p class="text-muted">暂无通知</p>';
        });
}

function loadAdminResults() {
    if (!contract) return;
    contract.methods.getResults().call()
        .then(function (result) {
            var el = document.getElementById('results');
            if (!el) return;
            var candidates = result[0];
            var votes = result[1];
            if (!candidates || candidates.length === 0) {
                el.innerHTML = '<div class="alert alert-info">暂无候选人数据</div>';
                return;
            }
            var totalVotes = 0;
            for (var i = 0; i < votes.length; i++) totalVotes += Number(votes[i]);
            var html = '<div class="alert alert-secondary mb-4"><strong>总投票数:</strong> ' + totalVotes + '</div>';
            for (var j = 0; j < candidates.length; j++) {
                var voteCount = Number(votes[j]);
                var pct = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
                html += '<div class="mb-3"><div class="d-flex justify-content-between mb-1"><strong>' + candidates[j] + '</strong><span>' + voteCount + ' 票 (' + pct + '%)</span></div>' +
                    '<div class="progress" style="height:30px"><div class="progress-bar" style="width:' + pct + '%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%)">' + pct + '%</div></div></div>';
            }
            el.innerHTML = html;
        })
        .catch(function (err) { console.error(err); });
}

function register() {
    var code = document.getElementById('userRegCode').value.trim();
    var regStatus = document.getElementById('registerStatus');

    if (!code) {
        if (regStatus) regStatus.innerHTML = '<div class="alert alert-danger">请输入注册码</div>';
        return;
    }

    if (regStatus) regStatus.innerHTML = '<div class="alert alert-info"><div class="spinner-border spinner-border-sm me-2"></div>正在处理...</div>';
    if (walletType === 'metamask') showNotification('请在 MetaMask 中确认交易', 'info');

    contract.methods.register(code).send({ from: currentAccount, gas: 3000000 })
        .then(function(receipt) {
            // 交易已确认！
            if (regStatus) regStatus.innerHTML = '<div class="alert alert-success"><div class="d-flex align-items-center"><span class="text-2xl mr-2">✓</span><div><h4>注册已确认</h4><p>交易已成功上链！</p><p class="small mt-1">区块高度: ' + receipt.blockNumber + ' | 交易哈希: ' + receipt.transactionHash.substring(0, 20) + '...</p></div></div>';
            document.getElementById('userRegCode').value = '';
            checkRegistration();
            showNotification('注册成功！交易已确认 ✓', 'success');
        })
        .catch(function (err) {
            console.error('[注册] 失败:', err);
            var errorMsg = err.message || err;
            
            if (err.code === 4001) {
                if (regStatus) regStatus.innerHTML = '<div class="alert alert-warning"><h5>⚠️ 您取消了交易</h5></div>';
            } else if (errorMsg.includes('Already registered') || errorMsg.includes('already registered')) {
                if (regStatus) regStatus.innerHTML = '<div class="alert alert-success"><div class="d-flex align-items-center"><span class="text-2xl mr-2">✓</span><div><h4>注册已确认</h4><p>您的账户已在区块链上注册</p></div></div>';
                checkRegistration();
            } else if (errorMsg.includes('Invalid or used registration code')) {
                if (regStatus) regStatus.innerHTML = '<div class="alert alert-danger"><h5>❌ 注册失败</h5><p>注册码无效或已被使用</p></div>';
            } else if (errorMsg.includes('revert')) {
                var revertMsg = extractRevertMessage(errorMsg);
                if (revertMsg.includes('Already registered')) {
                    if (regStatus) regStatus.innerHTML = '<div class="alert alert-success"><div class="d-flex align-items-center"><span class="text-2xl mr-2">✓</span><div><h4>注册已确认</h4><p>您的账户已在区块链上注册</p></div></div>';
                    checkRegistration();
                } else {
                    if (regStatus) regStatus.innerHTML = '<div class="alert alert-danger"><h5>❌ 交易失败</h5><p>' + revertMsg + '</p></div>';
                }
            } else {
                if (regStatus) regStatus.innerHTML = '<div class="alert alert-danger"><h5>❌ 注册失败</h5><p>' + errorMsg + '</p></div>';
            }
        });
}

function checkRegistration() {
    if (!contract || !currentAccount) return;
    contract.methods.isRegistered(currentAccount).call()
        .then(function (isRegistered) {
            var regStatus = document.getElementById('registerStatus');
            if (isRegistered) {
                if (regStatus) regStatus.innerHTML = '<div class="alert alert-success"><div class="d-flex align-items-center"><span class="text-2xl mr-2">✓</span><div><h4>注册已确认</h4><p>您的账户已在区块链上注册</p></div></div>';
                document.getElementById('voteSection').style.display = 'block';
                loadVoteCandidates();
            } else {
                if (regStatus) regStatus.innerHTML = '<p class="text-muted">请输入注册码完成注册</p>';
            }
        });
}

function loadVoteCandidates() {
    if (!contract) return;
    contract.methods.getResults().call()
        .then(function (result) {
            var candidates = result[0];
            var el = document.getElementById('candidates');
            if (!el || !candidates || candidates.length === 0) {
                if (el) el.innerHTML = '<p class="text-muted">暂无候选人</p>';
                return;
            }
            var html = '';
            for (var i = 0; i < candidates.length; i++) {
                html += '<button class="btn btn-outline-primary m-2" onclick="vote(' + i + ')">' + candidates[i] + '</button>';
            }
            el.innerHTML = html;
        });
}

function loadUserVote() {
    if (!contract || !currentAccount) return;
    
    var voteSection = document.getElementById('voteSection');
    if (!voteSection) return;
    
    Promise.all([
        contract.methods.isRegistered(currentAccount).call(),
        contract.methods.hasVoted(currentAccount).call()
    ]).then(function (data) {
        var isRegistered = data[0];
        var hasVoted = data[1];
        
        if (!isRegistered) {
            voteSection.style.display = 'none';
        } else if (hasVoted) {
            voteSection.innerHTML = '<div class="alert alert-success"><h5>✓ 您已投票</h5><p>感谢您的参与！</p></div>';
        } else {
            voteSection.style.display = 'block';
            loadVoteCandidates();
        }
    });
}

function vote(candidateId) {
    if (!confirm('确定要为候选人投票吗？投票后将无法更改！')) return;

    showSpinner();
    if (walletType === 'metamask') showNotification('请在 MetaMask 中确认交易', 'info');

    contract.methods.vote(candidateId).send({ from: currentAccount, gas: 3000000 })
        .then(function (receipt) {
            hideSpinner();
            showNotification('投票成功！交易已确认 ✓', 'success');
            alert('投票成功！\n\n交易已确认！\n区块: ' + receipt.blockNumber);
            loadUserVote();
            loadUserResults();
        })
        .catch(function (err) {
            hideSpinner();
            if (err.code === 4001) { alert('您取消了交易'); return; }
            alert('投票失败: ' + (err.message || err));
        });
}

function loadUserNotifications() {
    if (!contract) return;
    
    contract.methods.getNotificationCount().call()
        .then(function(count) {
            var el = document.getElementById('userNotificationList');
            if (!el) return;
            
            if (count === 0 || count === '0') {
                el.innerHTML = '<p class="text-muted">暂无通知</p>';
                return;
            }
            
            var notifications = [];
            var fetched = 0;
            
            for (var i = 0; i < count; i++) {
                (function(index) {
                    contract.methods.notifications(index).call()
                        .then(function(n) {
                            notifications[index] = n;
                            fetched++;
                            if (fetched >= count) {
                                var html = '<ul class="list-group">';
                                for (var j = 0; j < notifications.length; j++) {
                                    html += '<li class="list-group-item">' + (j + 1) + '. ' + notifications[j] + '</li>';
                                }
                                html += '</ul>';
                                el.innerHTML = html;
                            }
                        })
                        .catch(function() {
                            fetched++;
                        });
                })(i);
            }
        })
        .catch(function() {
            var el = document.getElementById('userNotificationList');
            if (el) el.innerHTML = '<p class="text-muted">暂无通知</p>';
        });
}

function loadUserResults() {
    if (!contract) return;
    contract.methods.getResults().call()
        .then(function (result) {
            var el = document.getElementById('results');
            if (!el) return;
            var candidates = result[0];
            var votes = result[1];
            if (!candidates || candidates.length === 0) {
                el.innerHTML = '<div class="alert alert-info">暂无候选人数据</div>';
                return;
            }
            var totalVotes = 0;
            for (var i = 0; i < votes.length; i++) totalVotes += Number(votes[i]);
            var html = '<div class="alert alert-secondary mb-4"><strong>总投票数:</strong> ' + totalVotes + '</div>';
            for (var j = 0; j < candidates.length; j++) {
                var voteCount = Number(votes[j]);
                var pct = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
                html += '<div class="mb-3"><div class="d-flex justify-content-between mb-1"><strong>' + candidates[j] + '</strong><span>' + voteCount + ' 票 (' + pct + '%)</span></div>' +
                    '<div class="progress" style="height:30px"><div class="progress-bar" style="width:' + pct + '%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%)">' + pct + '%</div></div></div>';
            }
            el.innerHTML = html;
        })
        .catch(function (err) { console.error(err); });
}

function extractRevertMessage(errorMsg) {
    var revertPattern = /\"([^\"]+)\"/;
    var match = errorMsg.match(revertPattern);
    if (match && match[1]) {
        return match[1];
    }
    var cleanPattern = /revert\s+(.+)/i;
    match = errorMsg.match(cleanPattern);
    if (match && match[1]) {
        return match[1].trim();
    }
    return '智能合约执行失败，请检查交易条件';
}

console.log('🗳️ 区块链投票系统已就绪 - 支持 Ganache + MetaMask');
console.log('✓ 交易等待确认功能已启用！');
