import axios from 'axios';

const stripe = Stripe("pk_test_51I8pHxDST78sZgTkylrfANeg6yJBeL2uRd1DD01BWsCeURengotC0xg9Ba5fbF7OjT2e4VLI29MB90aLQOORNK9N00Jjk9MT9Q");

import { showAlert } from './alert';

export const bookTour = async (tourId) =>{

    try{
        // 1) Get checktout session from the API
        const session = await axios({
            method: 'GET',
            url: `/api/v1/booking/checkout-session/${tourId}`
        });
        // 2) Create checktout form + charge credut card 
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
    }
    catch(err){
        console.log(err);
        showAlert('error', err);
    }
}