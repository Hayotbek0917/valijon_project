from django.core.management.base import BaseCommand

from apps.management.magazin_seed import run_ecosystem_seed


class Command(BaseCommand):
    help = "100 ta magazin — har biriga to'liq ekosistem (barcha magazinlarga)"

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=100)
        parser.add_argument("--clear", action="store_true")
        parser.add_argument("--products-min", type=int, default=500)
        parser.add_argument("--products-max", type=int, default=1000)
        parser.add_argument("--suppliers-min", type=int, default=30)
        parser.add_argument("--suppliers-max", type=int, default=50)
        parser.add_argument("--debtors-min", type=int, default=200)
        parser.add_argument("--debtors-max", type=int, default=300)
        parser.add_argument("--daily-sales-min", type=int, default=25)
        parser.add_argument("--daily-sales-max", type=int, default=45)
        parser.add_argument("--revenue-min", type=int, default=5_000_000)
        parser.add_argument("--revenue-max", type=int, default=10_000_000)
        parser.add_argument("--history-days", type=int, default=30)
        parser.add_argument("--sub-branches-min", type=int, default=1)
        parser.add_argument("--sub-branches-max", type=int, default=3)

    def handle(self, *args, **options):
        self.stdout.write(
            "Har bir magazinga ma'lumot yuklanmoqda "
            f"({options['count']} ta) — bu uzoq vaqt olishi mumkin..."
        )
        totals = run_ecosystem_seed(
            count=options["count"],
            clear=options["clear"],
            products_min=options["products_min"],
            products_max=options["products_max"],
            suppliers_min=options["suppliers_min"],
            suppliers_max=options["suppliers_max"],
            debtors_min=options["debtors_min"],
            debtors_max=options["debtors_max"],
            daily_sales_min=options["daily_sales_min"],
            daily_sales_max=options["daily_sales_max"],
            revenue_min=options["revenue_min"],
            revenue_max=options["revenue_max"],
            sub_branches_min=options["sub_branches_min"],
            sub_branches_max=options["sub_branches_max"],
            history_days=options["history_days"],
            stdout=self.stdout,
            style=self.style,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"\nTayyor — barcha {totals['branches']} ta magazin to'ldirildi!\n"
                f"  Mahsulotlar: {totals['products']:,}\n"
                f"  Dilerlar: {totals['suppliers']:,}\n"
                f"  Qarzdorlar: {totals['debtors']:,}\n"
                f"  Sotuvlar: {totals['sales']:,}\n"
                f"  Jami aylanma: {totals['revenue']:,.0f} so'm\n"
                f"  Profil: foydali {totals['profiles'].get('foydali', 0)}, "
                f"past {totals['profiles'].get('past', 0)}, "
                f"zarar {totals['profiles'].get('zarar', 0)}\n"
                f"\nLogin: superadmin / 123 | m001.admin / 123\n"
                f"store_logins.txt"
            )
        )
