const strideAssets = require('./strideAssets.js') 

let strideRedemptionRates=[];
const webhookURL = 'https://discord.com/api/webhooks/1200638486273855539/Jx7HvbY_NM0hNymd_lxzOGcSGF2-Ro2EkGx2kJid2624PEuY7DqTtOS_8Z8FdZDNzv61';

async function sendDepeg(dexPrice, rate, peg) {
    let message = `
    @here
    **Opportunity Log:**
    - **peg:** ${peg}
    - **Osmosis Price :** ${dexPrice}
    - **Stride Rate:** ${rate}

    ---
    *Note: This is an automated log.*
    `;

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message
            })
        });

        if (response.ok) {
            console.log('Message sent successfully');
        } else {
            console.error('Failed to send message:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

async function checkPriceSkip(base, derivative) {
    const url = 'https://api.skip.money/v2/fungible/route';
        const data = {
            amount_in: "1000",
            source_asset_denom: base,
            source_asset_chain_id: "osmosis-1",
            dest_asset_denom: derivative,
            dest_asset_chain_id: "osmosis-1",
            cumulative_affiliate_fee_bps: "0",
            client_id: "skip-api-docs"
          };

    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const responseData = await response.json();
      const osmosisPrice = parseFloat(responseData.amount_out);
      const price = 1000/osmosisPrice

      
      return price;
    } catch (error) {
      console.error('There was a problem with your fetch operation:', error);
      throw error;
    }
  }

  async function setStrideRates() {
    const url = 'https://stride-api.polkachu.com/Stride-Labs/stride/stakeibc/host_zone';

    try {
        const response = await fetch(url);
        const data = await response.json();

        let chains = data.host_zone;
        for (let i = 0; i < chains.length; i++) {
            let element = chains[i];
            let chainInfo = [element.chain_id, element.redemption_rate]
            strideRedemptionRates.push(chainInfo)
        }

        return strideRedemptionRates;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

async function compareRates(){
    let strideRedemptionRates = await setStrideRates()
    

    for(let i = 0; i<strideAssets.length;i++){
        let rate = 0
        let dexPrice = await checkPriceSkip(strideAssets[i].nativeAsset, strideAssets[i].strideAsset)
        for(count in strideRedemptionRates){
            if (strideRedemptionRates[count][0] == strideAssets[i].chainId){
                rate = strideRedemptionRates[count][1]
                let peg = dexPrice/rate;
                if(peg>1.01 || peg <.99){
                    console.log(dexPrice, rate);
                    sendDepeg(dexPrice,rate, peg)
                }
            }
        }
        
    }
    
}
compareRates()