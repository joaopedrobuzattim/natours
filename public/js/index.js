// Rodar em todas as versoes nos navegadores
import '@babel/polyfill';
import { login } from './login';
import { logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alert';


//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataElement = document.querySelector('.form-user-data');
const userDataPasswordForm = document.querySelector(".form-user-settings");
const bookBtn = document.getElementById('book-tour');
const alertMessage = document.querySelector('body').dataset.alert;

//DELEGATION
if(mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}


if(loginForm){
    loginForm.addEventListener('submit', e =>{
        e.preventDefault();
        //VALUES
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email,password)
    })

}


if(logOutBtn) logOutBtn.addEventListener('click',logout)

if(userDataElement){

    userDataElement.addEventListener('submit', (e)=>{

        e.preventDefault();
        const form = new FormData();
        // Recriando estrutura enctype='multipart/form-data'
        form.append('name',document.getElementById('name').value);
        form.append('email',document.getElementById('email').value)
        form.append('photo',document.getElementById('photo').files[0]);

        /*const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        updateSettings({ name, email }, 'data');*/ 

        updateSettings(form, 'data');
    })
}
if(userDataPasswordForm){

    userDataPasswordForm.addEventListener('submit', async (e)=>{

        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...'

        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;

        //Nesse caso o await foi utilizado para esperar a troca e realizar
        // as alteracoes de layout abaixo
        await updateSettings({passwordCurrent,password,passwordConfirm}, 'password');
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
        document.querySelector('.btn--save-password').textContent = 'Save password'
    })
}

if(bookBtn)
    bookBtn.addEventListener('click', e=>{
        e.target.textContent = 'Processing...';
        const tourId = e.target.dataset.tourId;
        bookTour(tourId);
    })

if(alertMessage)  showAlert('success',alertMessage, 20);