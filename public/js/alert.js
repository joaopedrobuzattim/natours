
export const hiddeAlert = () => {
    const el = document.querySelector('.alert');
    // dom manipulation para remover o elemento
    if (el) el.parentElement.removeChild(el);
}

//type is 'success' or 'error'
export const showAlert = (type,msg) =>{

    hiddeAlert();

    const markup = `<div class="alert alert--${type}">${msg}</div>`
    // INSERIR NO COMEÇO DO BODY
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

    window.setTimeout(hiddeAlert, 5000)
}