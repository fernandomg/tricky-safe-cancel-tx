# Cancel Safe TX with refundReceiver

## ENV
`SAFE` -- the safe you want to send the cancel tx to
`ACCOUNT` -- the owner that will be creator for the cancel tx and the `refundReceiver` too
`Pk` -- the `ACCOUNT`'s PK

## How to use it?
1. `yarn install`
2. add `.env` with proper values
3. `NONCE=nnn npx ts-node ./index.ts` (`NONCE` must be the nonce for the tx you want to cancel)i

Note: Code was copied and adapted from: https://gist.github.com/rmeissner/0fa5719dc6b306ba84ee34bebddc860b#file-safe_sig_gen_uport_eip712-ts
