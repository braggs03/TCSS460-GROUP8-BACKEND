import { BookInfo, IBook} from './types';

function getBookInfoQuery(WHERE: string = '1 = 1'): string {
    return `
    SELECT
        book_isbn,
        STRING_AGG(AUTHORS.author_name, ', ') as authors,
        publication_year,
        title,
        series_name,
        series_position,
        rating_avg,
        rating_count,
        rating_1_star,
        rating_2_star,
        rating_3_star,
        rating_4_star,
        rating_5_star,
        image_url,
        image_small_url
    FROM
        BOOK_MAP
        JOIN BOOKS ON BOOK_MAP.book_isbn = BOOKS.isbn13
        JOIN AUTHORS ON BOOK_MAP.author_id = AUTHORS.id
        LEFT JOIN SERIES ON BOOK_MAP.series_id = SERIES.id
    WHERE
        ${WHERE}
    GROUP BY
        book_isbn,
        publication_year,
        title,
        series_name,
        series_position,
        rating_avg,
        rating_count,
        rating_1_star,
        rating_2_star,
        rating_3_star,
        rating_4_star,
        rating_5_star,
        image_url,
        image_small_url
    `;
}

function convertBookInfoToIBookInfo(bookInfo: BookInfo): IBook {
    return {
        isbn13: bookInfo.book_isbn,
        authors: bookInfo.authors,
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

export { getBookInfoQuery, convertBookInfoToIBookInfo }