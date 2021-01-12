/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alert';

export const login = async (email, password) =>{

    try{
    const result = await axios({
        method: 'POST',
        url: '/api/v1/users/login',
        data:{
            email,
            password
        }
    });
    if(result.data.status === 'success'){
        showAlert('success', 'Logged in successfully!');
        // Redireciona para a homepage apos o login
        window.setTimeout(()=>{
            location.assign('/');
        },1000);
        
    }
    } catch (err){
        showAlert('error',err.response.data.message);
    }
}

export const logout = async ()=>{
    try{
        const result = await axios({
            method: 'GET',
            url: '/api/v1/users/logout'
        })

        if(result.data.status === 'success') window.setTimeout(()=>{
            location.assign('/');
        },100);

    } catch(err){
        console.log(err.response);
        showAlert('error', 'Error logging out! Try again');
    }
}
