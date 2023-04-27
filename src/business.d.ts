type ClipBoard = {
	created_at: string;
	type: 'text';
	_id: string;
	content: string;
	note: string;
}

type BookMark = {
	created_at: number;
	_id: string;
	class: string;
	title: string;
	link: string;
	icon: string;
	icon_id: number;
}

type BookMarkAction = {
    _id: string;
    uid: string;
    action: string;
    created_at: number;
}

type Icon = {
    id: number;
    domain: string;
    image: string;
}