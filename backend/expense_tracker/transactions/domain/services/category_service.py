from ..models.category import Category


class Category_Service:
    @staticmethod
    def get_all_categories():
        return Category.objects.all()
    
    @staticmethod
    def get_category_by_name(category_name):
        return Category.objects.filter(name=category_name).first()
    
    @staticmethod
    def create_category_if_not_present(category_name):
        category_name = category_name.strip().lower()
        category = Category_Service.get_category_by_name(category_name)
        if not category:
            Category.objects.create(name=category_name)
        return Category_Service.get_category_by_name(category_name)