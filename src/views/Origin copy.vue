<template>
  <div class="text-center pt-12">
    <h1 class="text-2xl font-bold mb-8">
      Bridge from {{originNetwork}} to {{destinationNetwork}}
    </h1>

    <p>
      This bridge allows you to send coin from {{originNetwork}} to {{destinationNetwork}}
    </p>

    <WalletConnect
      class="my-4"
      :targetNetwork="originNetwork"
      :targetNetworkId="originNetworkId"
      :currency="ETH"
      :decimals="18"
    />

    <form class="w-96 mt-8 mx-auto">
      <label for="price" class="block mb-2 font-medium text-gray-700"
        >How much coin do you want to bridge?</label
      >
      <div class="mt-4 w-2/3 mx-auto relative rounded-md shadow-sm">
        <div
          class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
          <span class="text-gray-500 sm:text-sm"> $ </span>
        </div>
        <input
          type="text"
          v-model="amount"
          name="price"
          id="price"
          class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
          placeholder="0.00"
          aria-describedby="price-currency"
        />
        <div
          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
        >
          <span class="text-gray-500 sm:text-sm" id="price-currency">
            Dym
          </span>
        </div>
      </div>
      <p class="text-xs mt-1">Your balance is: {{ walletBalance }}</p>

      <button
        type="button"
        class="inline-flex items-center px-4 py-2 mt-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        @click="sendTokens"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="m-ml-1 mr-3 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {{
          trxInProgress ? `Processing...` : `Bridge to ${destinationNetwork}`
        }}
      </button>
    </form>
    <p
      v-if="bridgedOk"
      class="px-4 py-2 bg-blue-100 text-blue-600 border border-blue-600 rounded-lg w-2/5 mx-auto my-8"
    >
      Tokens sent to {{ destinationNetwork }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { ethers, BigNumber } from 'ethers'

import { useWalletStore } from '../stores/wallet'
import WalletConnect from '@/components/WalletConnect.vue'
import coinIntegrationAbi from '../abis/coinIntegrationAbi.json';
import ChainstackDollars from '@/artifacts/contracts/OriginToken.sol/ChainstackDollars.json'
import { sign } from 'crypto';

export default defineComponent({
  components: { WalletConnect },
  setup() {
    const trxInProgress = ref<boolean>(false)
    const bridgedOk = ref<boolean>(false)

    const walletStore = useWalletStore()
    const amount = ref<String>('')
    const walletBalance = ref<Number>(0)

    const originTokenAddress = import.meta.env.VITE_ORIGIN_TOKEN_ADDRESS

    const originNetwork = import.meta.env.VITE_ORIGIN_NETWORK_NAME
    const originNetworkId = import.meta.env.VITE_ORIGIN_NETWORK_ID
    const destinationNetwork = import.meta.env.VITE_DESTINATION_NETWORK_NAME
    const tokenNetworkRPC = import.meta.env.VITE_DESTINATION_NETWORK_RPC
    const taxPercent = import.meta.env.VITE_TAX_PERCENT
    const gasLimit = import.meta.env.VITE_TOKEN_GAS_LIMIT
    
    const bridgeWallet = import.meta.env.VITE_BRIDGE_WALLET
    console.log("ethers.providers", ethers)
    
    // get the account that will pay for the trasaction
    
    const checkBalance = async function () {
      // if (walletStore.address) {
        const provider = await new ethers.WebSocketProvider(window.ethereum)
      console.log('check balance', walletStore.address, provider)
      let balance = await provider.getBalance(walletStore.address)
      balance = ethers.utils.formatUnits(balance, 18)
      console.log('balance :>> ', balance)
      walletBalance.value = balance
      // }
    }

    const sendTokens = async function () {
      const provider = new ethers.WebSocketProvider(window.ethereum)
      console.log("gas data: ")
      const signer = provider.getSigner()
      console.log("gas data: ", signer, coinIntegrationAbi)
      let coinIntegrationContract = await new ethers.Contract(
        originTokenAddress,
        coinIntegrationAbi,
        provider
      )
      const contractWithSigner = coinIntegrationContract.connect(provider)
      let totalAmount = 0
      const amountFormatted = Number(amount.value) * Math.pow(10, 18)
      
      const taxAmount = amountFormatted * taxPercent / 100
      const tokenProvider = await new ethers.JsonRpcProvider(tokenNetworkRPC);
      const gasPrice = await tokenProvider.getFeeData();
      
      const gasPriceInWei = ethers.formatUnits(gasPrice.maxFeePerGas, 'wei');
      console.log("gas data: ", gasPriceInWei, gasPrice, coinIntegrationContract)
      const feeAmount = gasLimit * gasPriceInWei
      totalAmount = (amountFormatted + taxAmount + feeAmount) / Math.pow(10, 18)
      console.log("!!!!coin amount: ", totalAmount, feeAmount, taxAmount, amountFormatted)
      //@ts-expect-error Window.ethers not TS
      if (typeof window.ethereum !== 'undefined') {
        trxInProgress.value = true

        try {
          // const transaction = {
          //   to: originTokenAddress,
          //   value: amountFormatted,
          // };
          // await signer.sendTransaction(transaction)
          await contractWithSigner.DivideCoin(
            
            amountFormatted,
            feeAmount,
            {
              value: totalAmount
            }
            
          )
          .then((tx) => {
            console.log("Transaction hash:", tx.hash);
          })
          .catch((error) => {
            console.error("Error sending transaction:", error);
          });
          
          bridgedOk.value = true
          amount.value = ''
          trxInProgress.value = false
        } catch (error) {
          console.error(error)
          trxInProgress.value = false
        }
      }
    }

    return {
      walletStore,
      trxInProgress,
      amount,
      walletBalance,
      sendTokens,
      checkBalance,
      originNetwork,
      originNetworkId,
      destinationNetwork,
      bridgedOk,
    }
  },

  mounted() {
    console.log("useWalletStore().address", useWalletStore())
  },

  computed: {
    accAvailable() {
      return useWalletStore().address
    },
  },
  watch: {
    async accAvailable(newVal, old) {
      console.log(`updating from ${old} to ${newVal}`)
      await this.checkBalance()
    },
  },
})
</script>
