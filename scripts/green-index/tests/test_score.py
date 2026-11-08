import pytest

from gi.score import Fractions, band, display_value, monte_carlo, score, sub_scores


def test_report_worked_example():
    # Illustration from the research report: T=12, G=8, W=2, S=60 -> Cs=40, Os=33.3, Us=40, GI ~ 38.7
    f = Fractions(tree=12, other_veg=8, water=2, sealed=60, bare=18)
    cs, os_, us = sub_scores(f)
    assert cs == pytest.approx(40)
    assert os_ == pytest.approx(33.333, abs=0.01)
    assert us == pytest.approx(40)
    assert score(f) == pytest.approx(38.67, abs=0.01)
    assert display_value(score(f)) == 40
    assert band(score(f)) == "Moderate"  # band follows the displayed value


def test_targets_cap_at_100_and_bounds():
    lush = Fractions(tree=70, other_veg=25, water=5, sealed=0, bare=0)
    assert sub_scores(lush) == (100.0, 100.0, 100.0)
    assert score(lush) == pytest.approx(100)
    concrete = Fractions(tree=0, other_veg=0, water=0, sealed=100, bare=0)
    assert score(concrete) == 0
    assert band(score(concrete)) == "Low"


@pytest.mark.parametrize("value,expected", [(37.4, "Low"), (37.6, "Moderate"), (67.4, "Moderate"), (67.6, "High")])
def test_band_edges_use_rounded_value(value, expected):
    assert band(value) == expected


def test_monte_carlo_is_reproducible_and_brackets_the_score():
    base = Fractions(tree=12, other_veg=8, water=2, sealed=60, bare=18)
    variants = [base, Fractions(tree=9, other_veg=11, water=2, sealed=60, bare=18)]
    a = monte_carlo(variants, base)
    b = monte_carlo(variants, base)
    assert a == b
    assert a.p05 < score(base) < a.p95
    assert a.borderline  # 38.7 sits on the Low/Moderate edge


def test_clear_cases_are_not_borderline():
    base = Fractions(tree=55, other_veg=20, water=0, sealed=10, bare=15)
    u = monte_carlo([base], base)
    assert not u.borderline and u.band_flip_rate < 0.05
