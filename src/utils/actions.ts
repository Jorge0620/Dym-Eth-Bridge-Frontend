import axios from "axios"

export const getFeeAmount = async (amount) => {

    let res = await axios.post("https://bridge-dym-eth.vercel.app/c2tfee", {
    //let res = await axios.post("http://localhost:3001/c2tfee", {
        amount: amount
    });
    console.log("get fee data: ", res)
    return res.data
}

export const getT2CFeeAmount = async (amount) => {
    let res = await axios.post("https://bridge-dym-eth.vercel.app/t2cfee", {
        amount: amount
    });
    console.log("get getT2CFeeAmount data: ", res)
    return res.data
}