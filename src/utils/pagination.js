module.exports.Pagination = async (count,  perPage , skip) => {

    let pagination = {
        count,
        perPage: parseInt(perPage),
        pages: Math.ceil(count / parseInt(perPage)),
        current: parseInt(skip) + 1,
    };
    return pagination;

}