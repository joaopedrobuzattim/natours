import axios from 'axios';

import { showAlert } from './alert';

// type is either 'password' or 'data'
export const updateSettings = async (data, type)=>{

    //console.log(data);

    const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe'

    // Muda primeira letra para maiuscula
    // stackoverflow
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    try{
        const result = await axios.patch(url,data)
        
        if(result.data.status === 'success') showAlert('success', 
        `${type.capitalize()} Updated successfully!`);
    } catch (err){
        showAlert('error',err.response.data.message);
    }

        


    }


