from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client.crawler_db

website_configs = [
    {
        "_id": "vnexpress",
        "name": "VnExpress",
        "base_url": "https://vnexpress.net",
        "search_url_template": "https://vnexpress.net", 
        "selectors": {
            "search_button": "#buttonSearchHeader",
            "search_input": "#keywordHeader",
            "post_item": ".title-news", 
            "title_link": "a",          
            "detail_title": ".title-detail", 
            "detail_content": "article.fck_detail"
        }
    },
    {
        "_id": "dantri",
        "name": "Dân Trí",
        "base_url": "https://dantri.com.vn",
        "search_url_template": "https://dantri.com.vn/tim-kiem.htm",
        "selectors": {
            "search_button": None,
            "search_input": "input[name='s']", 
            "post_item": ".article-title",
            "title_link": "a",             
            "detail_title": ".title-page",
            "detail_content": ".singular-content"
        }
    }
]

print("♻️ Đang reset cấu hình...")
db.websites.delete_many({})
for site in website_configs:
    db.websites.insert_one(site)
print("✅ Đã cập nhật xong! Hãy chạy lại API.")