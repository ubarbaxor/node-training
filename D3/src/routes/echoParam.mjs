export default (req, res) => {
    const data = { param: req.params.value }

    res.send(data)
}
