import EIP712Domain from "eth-typed-data";
import BigNumber from "bignumber.js";
import * as ethUtil from 'ethereumjs-util';
import { ethers } from "ethers";
import axios from "axios";
import { config } from 'dotenv'

// env
config()

const gnosisEstimateTransaction = async (safe: string, tx: any): Promise<any> => {
  console.log('estimate tx --', JSON.stringify(tx));

  try {
    const resp = await axios.post(`https://safe-relay.rinkeby.gnosis.pm/api/v2/safes/${safe}/transactions/estimate/`, tx)
    console.log('estimate response data --', resp.data)
    return resp.data
  } catch (e) {
    console.log('estimate POST error --', JSON.stringify(e.response.data))
    throw e
  }
}

const { utils } = ethers;

const gnosisProposeTx = async (safe: string, tx: any): Promise<any> => {
  try {
    const resp = await axios.post(`https://safe-transaction.staging.gnosisdev.com/api/v1/safes/${safe}/transactions/`, tx)
    console.log('propose POST data --', resp.data)
    return resp.data
  } catch (e) {
    if (e.response) console.log('propose POST error --', JSON.stringify(e.response.data))
    throw e
  }
}

const submit = async (safe, sender, privateKey) => {
  const safeDomain = new EIP712Domain({
    verifyingContract: safe,
  });

  const SafeTx = safeDomain.createType('SafeTx', [
    { type: "address", name: "to" },
    { type: "uint256", name: "value" },
    { type: "bytes", name: "data" },
    { type: "uint8", name: "operation" },
    { type: "uint256", name: "safeTxGas" },
    { type: "uint256", name: "baseGas" },
    { type: "uint256", name: "gasPrice" },
    { type: "address", name: "gasToken" },
    { type: "address", name: "refundReceiver" },
    { type: "uint256", name: "nonce" },
  ]);

  const to = utils.getAddress(process.env.SAFE);

  const baseTxn = {
    to,
    value: "1000",
    data: "0x",
    operation: "0",
  };

  console.log('base tx --', JSON.stringify({ baseTxn }));

  // Let the Safe service estimate the tx and retrieve the nonce
  const { safeTxGas, gasPrice } = await gnosisEstimateTransaction(
    safe,
    baseTxn,
  );

  const txn = {
    ...baseTxn,
    safeTxGas,
    nonce: process.env.NONCE,
    baseGas: 600000,
    gasPrice,
    gasToken: "0x0000000000000000000000000000000000000000",
    refundReceiver: process.env.ACCOUNT,
  };

  console.log({txn})

  const safeTx = new SafeTx({
    ...txn,
    data: utils.arrayify(txn.data)
  });
  const signer = async data => {
    let { r, s, v } = ethUtil.ecsign(data, ethUtil.toBuffer(privateKey));
    return ethUtil.toRpcSig(v, r, s)
  }
  const signature = await safeTx.sign(signer);

  console.log('signature --', { signature });

  const toSend = {
    ...txn,
    sender,
    contractTransactionHash: "0x" + safeTx.signHash().toString('hex'),
    signature: signature,
  };

  console.log('toSend --', JSON.stringify({ toSend }));

  const { data } = await gnosisProposeTx(safe, toSend);
  console.log('data --', {data})
  console.log("Done?");
}

// This example uses the transaction service to propose a transaction to the Safe Multisig interface
submit(process.env.SAFE, process.env.ACCOUNT, process.env.PK)
