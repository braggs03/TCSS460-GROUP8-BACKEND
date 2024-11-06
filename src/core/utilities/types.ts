interface BookInfo {
    book_isbn: number;
    authors: string;
    publication_year: number;
    original_title: string; 
    title: string;
    series_name: string;
    series_position: number;
    rating_avg: number;
    rating_count: number;
    rating_1_star: number;
    rating_2_star: number;
    rating_3_star: number;
    rating_4_star: number;
    rating_5_star: number;
    image_url: string;
    image_small_url: string;
}

interface IRatings {
    average: number;
    count: number;
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
}

interface IUrlIcon {
    large: string;
    small: string;
}

interface ISeriesInfo {
    name: string;
    position: number;
}

interface IBook {
    isbn13: number;
    authors: string;
    publication: number;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
    series_info?: ISeriesInfo;
}

export { BookInfo, IRatings, IUrlIcon, ISeriesInfo, IBook };