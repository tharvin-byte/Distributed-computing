import itertools
from typing import Dict, List, Tuple
from app.models import AssociationRule


def generate_association_rules(
    frequent_itemsets_dict: Dict[Tuple[str, ...], int],
    total_transactions: int,
    min_confidence: float = 0.5
) -> List[AssociationRule]:
    """
    Derives association rules (X => Y) from mined frequent itemsets.
    - Confidence(X => Y) = Support(X U Y) / Support(X)
    - Lift(X => Y) = Confidence(X => Y) / (Support(Y) / N) = (Support(X U Y) * N) / (Support(X) * Support(Y))
    """
    rules: List[AssociationRule] = []
    if total_transactions <= 0:
        return rules

    # Standardize lookup dictionary with sorted tuples
    itemset_lookup = {
        tuple(sorted(k)): count for k, count in frequent_itemsets_dict.items()
    }

    for itemset, supp_itemset in itemset_lookup.items():
        if len(itemset) < 2:
            continue

        item_list = list(itemset)
        # Generate non-empty proper subsets
        for r in range(1, len(item_list)):
            for antecedent_tuple in itertools.combinations(item_list, r):
                antecedent = tuple(sorted(antecedent_tuple))
                consequent = tuple(sorted(set(itemset) - set(antecedent)))

                supp_antecedent = itemset_lookup.get(antecedent)
                if not supp_antecedent or supp_antecedent <= 0:
                    continue

                confidence = supp_itemset / supp_antecedent
                if confidence < min_confidence:
                    continue

                supp_consequent = itemset_lookup.get(consequent, 0)
                if supp_consequent > 0:
                    lift = (supp_itemset * total_transactions) / (supp_antecedent * supp_consequent)
                else:
                    lift = 1.0

                rules.append(AssociationRule(
                    antecedent=list(antecedent),
                    consequent=list(consequent),
                    support_count=supp_itemset,
                    support_pct=round((supp_itemset / total_transactions) * 100, 2),
                    confidence=round(confidence, 4),
                    lift=round(lift, 4)
                ))

    # Sort by Lift descending, then Confidence descending
    rules.sort(key=lambda r: (r.lift, r.confidence), reverse=True)
    return rules

