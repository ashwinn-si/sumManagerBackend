const mongoose = require('mongoose');

const ImageStorage = new mongoose.Schema(
    {
        image : {
            data : Buffer,
            contentType : String,
        }
    }
)

const ImageModel = mongoose.model('ImageStorage', ImageStorage);

module.exports = ImageModel;