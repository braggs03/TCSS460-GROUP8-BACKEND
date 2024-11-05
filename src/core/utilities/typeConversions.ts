import { BookInfo, IBook} from './types';


function convertBookInfoToIBookInfo(bookInfo: BookInfo): IBook {
    return {
        isbn13: bookInfo.book_isbn,
        authors: bookInfo.authors.join(', '),
        publication: bookInfo.publication_year,
        title: bookInfo.title,
        ratings: {
            average: bookInfo.rating_avg,
            count: bookInfo.rating_count,
            rating_1: bookInfo.rating_1_star,
            rating_2: bookInfo.rating_2_star,
            rating_3: bookInfo.rating_3_star,
            rating_4: bookInfo.rating_4_star,
            rating_5: bookInfo.rating_5_star
        },
        icons: {
            large: bookInfo.image_url,
            small: bookInfo.image_small_url
        },
        series_info: {
            name: bookInfo.series_name,
            position: bookInfo.series_position
        }
    }
}

export {convertBookInfoToIBookInfo}
