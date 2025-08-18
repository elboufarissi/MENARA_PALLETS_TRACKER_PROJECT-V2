import React, { useState, useEffect, useRef, useMemo } from "react";
import "./CautionForm.css";

const AutocompleteInput = ({
  options = [],
  value,
  onChange,
  onSelect,
  disabled,
  className,
  onFocus,
  onBlur,
  register,
  // New API (used in CautionForm)
  searchKeys = ["code", "name"], // keys to search in options
  displayKeys = ["code", "name"], // keys to display in dropdown
  primaryKey = "code", // primary key for values
  // Old API (used in other forms) - for backward compatibility
  displayProperty,
  secondaryProperty,
  tertiaryProperty,
  valueProperty,
  noResultsText = "Aucun résultat trouvé",
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);
  const prevValueRef = useRef(value);

  // Determine which API is being used and normalize the keys
  const actualSearchKeys = useMemo(() => {
    return displayProperty
      ? [displayProperty, secondaryProperty, tertiaryProperty].filter(Boolean)
      : searchKeys;
  }, [displayProperty, secondaryProperty, tertiaryProperty, searchKeys]);

  const actualDisplayKeys = useMemo(() => {
    return displayProperty
      ? [displayProperty, secondaryProperty].filter(Boolean)
      : displayKeys;
  }, [displayProperty, secondaryProperty, displayKeys]);

  const actualPrimaryKey = useMemo(() => {
    return valueProperty || primaryKey;
  }, [valueProperty, primaryKey]);

  // Initialize search term from value - only when value actually changes
  useEffect(() => {
    const newValue = value || "";
    if (newValue !== prevValueRef.current) {
      setSearchTerm(newValue);
      prevValueRef.current = newValue;
    }
  }, [value]);

  // Filter options based on search term - memoize to prevent unnecessary recalculations
  const filteredOptions = useMemo(() => {
    // Ensure searchTerm is a string
    const validSearchTerm = typeof searchTerm === "string" ? searchTerm : "";

    if (options.length === 0 || validSearchTerm.length === 0) {
      return [];
    }

    return options.filter((option) => {
      const searchValue = validSearchTerm.toLowerCase();
      return actualSearchKeys.some((key) => {
        const fieldValue = option[key];
        // Convert to string and ensure it's valid before calling toLowerCase
        const stringValue = fieldValue != null ? String(fieldValue) : "";
        return stringValue && stringValue.toLowerCase().includes(searchValue);
      });
    });
  }, [options, searchTerm, actualSearchKeys]);

  // Reset selected index when filtered options change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filteredOptions.length]);

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    setSearchTerm(inputValue);

    // Call onChange to update form value
    if (onChange) {
      onChange(event);
    }

    // Show dropdown when typing
    if (inputValue.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (event) => {
    if (!showDropdown || filteredOptions.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex =
            prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : 0;
          // Scroll option into view
          setTimeout(() => {
            if (optionRefs.current[newIndex]) {
              optionRefs.current[newIndex].scrollIntoView({
                block: "nearest",
                behavior: "smooth",
              });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex =
            prevIndex > 0 ? prevIndex - 1 : filteredOptions.length - 1;
          // Scroll option into view
          setTimeout(() => {
            if (optionRefs.current[newIndex]) {
              optionRefs.current[newIndex].scrollIntoView({
                block: "nearest",
                behavior: "smooth",
              });
            }
          }, 0);
          return newIndex;
        });
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && filteredOptions[selectedIndex]) {
          handleOptionSelect(filteredOptions[selectedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        // No action for other keys
        break;
    }
  };

  const handleOptionSelect = (option) => {
    const selectedValue = option[actualPrimaryKey];
    setSearchTerm(selectedValue);
    setShowDropdown(false);
    setSelectedIndex(-1);

    // Create a synthetic event to maintain consistency
    const syntheticEvent = {
      target: { value: selectedValue },
      preventDefault: () => {},
      stopPropagation: () => {},
    };

    if (onChange) {
      onChange(syntheticEvent);
    }

    if (onSelect) {
      onSelect(option);
    }
  };

  const handleFocus = (e) => {
    if (searchTerm.length > 0) {
      setShowDropdown(true);
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e) => {
    // Delay hiding dropdown to allow clicking on options
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 200);
    if (onBlur) {
      onBlur(e);
    }
  };

  // Prevent mouse down on dropdown options from causing input blur
  const handleOptionMouseDown = (e) => {
    e.preventDefault();
  };

  return (
    <div className="client-autocomplete-container">
      <input
        {...(register ? register : {})}
        {...props}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className}
        autoComplete="off"
        disabled={disabled}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <div className="client-autocomplete-dropdown" ref={dropdownRef}>
          {filteredOptions.map((option, index) => (
            <div
              key={option.id || index}
              ref={(el) => (optionRefs.current[index] = el)}
              onMouseDown={handleOptionMouseDown}
              onClick={() => handleOptionSelect(option)}
              className={`client-autocomplete-option ${
                index === selectedIndex ? "selected" : ""
              }`}
              style={{
                backgroundColor:
                  index === selectedIndex ? "#e9ecef" : "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: "bold", pointerEvents: "none" }}>
                {option[actualDisplayKeys[0]]}
              </div>
              {actualDisplayKeys[1] && option[actualDisplayKeys[1]] && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#666",
                    marginTop: "2px",
                    pointerEvents: "none",
                  }}
                >
                  {option[actualDisplayKeys[1]]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showDropdown &&
        filteredOptions.length === 0 &&
        searchTerm.length > 0 && (
          <div className="client-autocomplete-dropdown">
            <div className="client-autocomplete-no-results">
              {noResultsText}
            </div>
          </div>
        )}
    </div>
  );
};

export default AutocompleteInput;
