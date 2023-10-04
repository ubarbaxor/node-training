export default (request, response) => {
    response.render('index.html', {
        title: 'Default route (D3)',
        message: 'Ça fonctionne !'
    })
}
