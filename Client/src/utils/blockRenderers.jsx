import React from 'react';
import Input from '../components/Common/Input';

/**
 * Renders blocks for the Home page
 * @param {Array} blocks - Array of block objects
 * @param {Boolean} isEditing - Whether the page is in edit mode
 * @param {Function} handleNestedFormChange - Function to handle form changes
 * @returns {JSX.Element} Rendered blocks
 */
export const renderHomePageBlocks = (blocks, isEditing, handleNestedFormChange) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks.map((block, blockIndex) => {
    if (!block || !block.blockType) return null;

    const key = `home-block-${blockIndex}-${block.blockType}`;

    switch (block.blockType) {
      case 'hero_section':
        return (
          <React.Fragment key={key}>
            <div className="relative bg-gray-900 text-white overflow-hidden rounded-lg">
              {block.background_image?.url && (
                <div className="absolute inset-0">
                  <img 
                    src={block.background_image.url} 
                    alt={block.background_image.alt || 'Hero background'} 
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-black ${block.overlay_style === 'dark' ? 'opacity-50' : 'opacity-20'}`}></div>
                </div>
              )}
              
              <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8 max-w-3xl mx-auto text-center">
                {isEditing ? (
                  <div className="space-y-4 mb-8 bg-white/80 p-4 rounded-lg">
                    <Input
                      label="Headline"
                      value={block.headline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                    />
                    <Input
                      label="Subheadline"
                      value={block.subheadline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.subheadline`, e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="CTA Text"
                        value={block.cta_text || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.cta_text`, e.target.value)}
                      />
                      <Input
                        label="CTA Link"
                        value={block.cta_link || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.cta_link`, e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Image URL"
                        value={block.background_image?.url || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.background_image.url`, e.target.value)}
                      />
                      <Input
                        label="Image Alt Text"
                        value={block.background_image?.alt || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.background_image.alt`, e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                      {block.headline || 'Welcome to our store'}
                    </h1>
                    <p className="mt-6 text-xl max-w-2xl mx-auto">
                      {block.subheadline || 'Discover our latest collections'}
                    </p>
                    {block.cta_text && (
                      <div className="mt-10">
                        <a
                          href={block.cta_link || '#'}
                          className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-java-600 hover:bg-java-700"
                        >
                          {block.cta_text}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </React.Fragment>
        );

      case 'shop_by_category':
        return (
          <React.Fragment key={key}>
            <div className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      label="Section Title"
                      value={block.headline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                      className="mb-4"
                    />
                  ) : (
                    <h2 className="text-3xl font-extrabold text-gray-900">
                      {block.headline || 'Shop by Category'}
                    </h2>
                  )}
                </div>

                <div className="mt-10">
                  <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                    {block.categories && block.categories.map((category, index) => (
                      <div key={`category-${index}`} className="group">
                        {isEditing ? (
                          <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                            <Input
                              label="Category Name"
                              value={category.name || ''}
                              onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.categories.${index}.name`, e.target.value)}
                            />
                            <Input
                              label="Image URL"
                              value={category.image || ''}
                              onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.categories.${index}.image`, e.target.value)}
                            />
                          </div>
                        ) : (
                          <a href="#" className="block">
                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
                              <img
                                src={category.image || '/placeholder-product.jpg'}
                                alt={category.name}
                                className="h-full w-full object-cover object-center group-hover:opacity-75"
                              />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">{category.name}</h3>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      case 'promotional_banner':
        return (
          <React.Fragment key={key}>
            <div className="bg-white py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {isEditing ? (
                  <Input
                    label="Section Title"
                    value={block.headline || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                    className="mb-4"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    {block.headline || 'Special Offers'}
                  </h2>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {block.banners && block.banners.map((banner, index) => (
                    <div key={`banner-${index}`} className="relative overflow-hidden rounded-lg">
                      {isEditing ? (
                        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                          <Input
                            label="Title"
                            value={banner.title || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.banners.${index}.title`, e.target.value)}
                          />
                          <Input
                            label="Subtitle"
                            value={banner.subtitle || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.banners.${index}.subtitle`, e.target.value)}
                          />
                          <Input
                            label="Image URL"
                            value={banner.image || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.banners.${index}.image`, e.target.value)}
                          />
                          <Input
                            label="CTA Button Text"
                            value={banner.cta_button?.text || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.banners.${index}.cta_button.text`, e.target.value)}
                          />
                          <Input
                            label="CTA Button Link"
                            value={banner.cta_button?.link || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.banners.${index}.cta_button.link`, e.target.value)}
                          />
                        </div>
                      ) : (
                        <>
                          <img
                            src={banner.image || '/placeholder-product.jpg'}
                            alt={banner.title}
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6 text-white">
                            <h3 className="text-xl font-bold">{banner.title}</h3>
                            <p className="mt-2">{banner.subtitle}</p>
                            {banner.cta_button?.text && (
                              <a
                                href={banner.cta_button.link || '#'}
                                className="mt-4 inline-block bg-white text-gray-900 px-4 py-2 rounded-md font-medium text-sm"
                              >
                                {banner.cta_button.text}
                              </a>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      case 'watch_and_buy':
        return (
          <React.Fragment key={key}>
            <div className="bg-gray-50 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                  {isEditing ? (
                    <Input
                      label="Section Title"
                      value={block.headline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                    />
                  ) : (
                    <h2 className="text-3xl font-extrabold text-gray-900">
                      {block.headline || 'Watch and Buy'}
                    </h2>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {block.products && block.products.map((product, index) => (
                    <div key={`product-${index}`} className="bg-white rounded-lg shadow overflow-hidden">
                      {isEditing ? (
                        <div className="p-4 space-y-4">
                          <Input
                            label="Product Name"
                            value={product.name || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.products.${index}.name`, e.target.value)}
                          />
                          <Input
                            label="Image URL"
                            value={product.image || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.products.${index}.image`, e.target.value)}
                          />
                          <Input
                            label="Price"
                            value={product.price || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.products.${index}.price`, e.target.value)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="aspect-w-1 aspect-h-1 w-full">
                            <img
                              src={product.image || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                            <p className="mt-1 text-lg font-medium text-gray-900">{product.price}</p>
                            <button className="mt-4 w-full bg-java-600 text-white py-2 px-4 rounded-md hover:bg-java-700">
                              Add to Cart
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      default:
        return null;
    }
  });
};

/**
 * Renders blocks for the About page
 * @param {Array} blocks - Array of block objects
 * @param {Boolean} isEditing - Whether the page is in edit mode
 * @param {Function} handleNestedFormChange - Function to handle form changes
 * @returns {JSX.Element} Rendered blocks
 */
export const renderAboutPageBlocks = (blocks, isEditing, handleNestedFormChange) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks.map((block, blockIndex) => {
    if (!block || !block.blockType) return null;

    const key = `about-block-${blockIndex}-${block.blockType}`;

    switch (block.blockType) {
      case 'page_header':
        return (
          <React.Fragment key={key}>
            <div className="bg-gray-50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {isEditing ? (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <Input
                      label="Headline"
                      value={block.headline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                    />
                    <Input
                      label="Subheadline"
                      value={block.subheadline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.subheadline`, e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                      {block.headline || 'About Us'}
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
                      {block.subheadline || 'Learn more about our company and our mission'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </React.Fragment>
        );

      case 'our_story':
        return (
          <React.Fragment key={key}>
            <div className="py-16 bg-white overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-8">
                  <div className="prose prose-lg prose-java mx-auto lg:max-w-none">
                    {isEditing ? (
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Our Story</label>
                        <textarea
                          rows={10}
                          className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={block.rich_text_story || ''}
                          onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.rich_text_story`, e.target.value)}
                        />
                      </div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: block.rich_text_story || '<p>Our story content goes here</p>' }} />
                    )}
                  </div>
                  <div className="mt-8 lg:mt-0">
                    <div className="aspect-w-3 aspect-h-2">
                      {isEditing ? (
                        <div className="space-y-4">
                          <Input
                            label="Image URL"
                            value={block.image?.url || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.image.url`, e.target.value)}
                          />
                          <Input
                            label="Image Alt Text"
                            value={block.image?.alt || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.image.alt`, e.target.value)}
                          />
                        </div>
                      ) : (
                        <img
                          className="object-cover shadow-lg rounded-lg"
                          src={block.image?.url || '/placeholder-product.jpg'}
                          alt={block.image?.alt || 'Our story'}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      case 'our_values':
        return (
          <React.Fragment key={key}>
            <div className="bg-gray-50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      label="Section Title"
                      value={block.headline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                      className="mb-4 max-w-md mx-auto"
                    />
                  ) : (
                    <h2 className="text-3xl font-extrabold text-gray-900">
                      {block.headline || 'Our Values'}
                    </h2>
                  )}
                </div>

                <div className="mt-10">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {block.value_cards && block.value_cards.map((card, index) => (
                      <div key={`value-${index}`} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          {isEditing ? (
                            <div className="space-y-4">
                              <Input
                                label="Title"
                                value={card.title || ''}
                                onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.value_cards.${index}.title`, e.target.value)}
                              />
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                  rows={4}
                                  className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                  value={card.description || ''}
                                  onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.value_cards.${index}.description`, e.target.value)}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
                              <p className="mt-2 text-base text-gray-500">{card.description}</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      case 'meet_our_team':
        return (
          <React.Fragment key={key}>
            <div className="bg-white py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      label="Section Title"
                      value={block.headline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                      className="mb-4 max-w-md mx-auto"
                    />
                  ) : (
                    <h2 className="text-3xl font-extrabold text-gray-900">
                      {block.headline || 'Meet Our Team'}
                    </h2>
                  )}
                </div>

                <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3 sm:grid-cols-2">
                  {block.team_members && block.team_members.map((member, index) => (
                    <div key={`team-${index}`} className="bg-white overflow-hidden shadow rounded-lg">
                      {isEditing ? (
                        <div className="p-4 space-y-4">
                          <Input
                            label="Name"
                            value={member.name || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.team_members.${index}.name`, e.target.value)}
                          />
                          <Input
                            label="Position"
                            value={member.position || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.team_members.${index}.position`, e.target.value)}
                          />
                          <Input
                            label="Photo URL"
                            value={member.photo?.url || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.team_members.${index}.photo.url`, e.target.value)}
                          />
                          <Input
                            label="Photo Alt Text"
                            value={member.photo?.alt || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.team_members.${index}.photo.alt`, e.target.value)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="h-48 w-full">
                            <img
                              className="h-full w-full object-cover"
                              src={member.photo?.url || '/placeholder-product.jpg'}
                              alt={member.photo?.alt || member.name}
                            />
                          </div>
                          <div className="px-4 py-4">
                            <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-500">{member.position}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      case 'cta_strip':
        return (
          <React.Fragment key={key}>
            <div className="bg-java-600">
              <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {isEditing ? (
                      <Input
                        label="Headline"
                        value={block.headline || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                        className="mb-4"
                      />
                    ) : (
                      <span>{block.headline || 'Ready to get started?'}</span>
                    )}
                  </h2>
                  {isEditing ? (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={block.description || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.description`, e.target.value)}
                      />
                    </div>
                  ) : block.description && (
                    <p className="mt-3 text-lg text-white">{block.description}</p>
                  )}
                </div>
                <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                  {block.buttons && block.buttons.map((button, index) => (
                    <div key={`button-${index}`} className={index > 0 ? 'ml-3' : ''}>
                      {isEditing ? (
                        <div className="space-y-4 p-4 bg-white rounded-md">
                          <Input
                            label="Button Text"
                            value={button.text || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.buttons.${index}.text`, e.target.value)}
                          />
                          <Input
                            label="Button Link"
                            value={button.link || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.buttons.${index}.link`, e.target.value)}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Style</label>
                            <select
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-java-500 focus:border-java-500 sm:text-sm rounded-md"
                              value={button.style || 'primary'}
                              onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.buttons.${index}.style`, e.target.value)}
                            >
                              <option value="primary">Primary</option>
                              <option value="secondary">Secondary</option>
                              <option value="outline">Outline</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={button.link || '#'}
                          className={`inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md ${
                            button.style === 'primary' ? 'text-java-600 bg-white hover:bg-gray-50' :
                            button.style === 'secondary' ? 'text-white bg-java-800 hover:bg-java-900' :
                            'text-white border-white hover:bg-java-700'
                          }`}
                        >
                          {button.text || 'Get started'}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      default:
        return null;
    }
  });
};

/**
 * Renders blocks for the Contact page
 * @param {Array} blocks - Array of block objects
 * @param {Boolean} isEditing - Whether the page is in edit mode
 * @param {Function} handleNestedFormChange - Function to handle form changes
 * @returns {JSX.Element} Rendered blocks
 */
export const renderContactPageBlocks = (blocks, isEditing, handleNestedFormChange) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks.map((block, blockIndex) => {
    if (!block || !block.blockType) return null;

    const key = `contact-block-${blockIndex}-${block.blockType}`;

    switch (block.blockType) {
      case 'page_header':
        return (
          <React.Fragment key={key}>
            <div className="bg-gray-50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {isEditing ? (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <Input
                      label="Headline"
                      value={block.headline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                    />
                    <Input
                      label="Subheadline"
                      value={block.subheadline || ''}
                      onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.subheadline`, e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                      {block.headline || 'Contact Us'}
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
                      {block.subheadline || 'Get in touch with our team'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </React.Fragment>
        );

      case 'contact_details':
      case 'contact_info':
        return (
          <React.Fragment key={key}>
            <div className="bg-white py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditing ? (
                      <Input
                        label="Section Title"
                        value={block.headline || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                      />
                    ) : (
                      block.headline || 'Contact Information'
                    )}
                  </h2>

                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {isEditing ? (
                              <Input
                                value={block.email || ''}
                                onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.email`, e.target.value)}
                              />
                            ) : (
                              block.email || 'contact@example.com'
                            )}
                          </dd>
                        </div>
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {isEditing ? (
                              <Input
                                value={block.phone || ''}
                                onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.phone`, e.target.value)}
                              />
                            ) : (
                              block.phone || '+1 (555) 123-4567'
                            )}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Address</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {isEditing ? (
                              <textarea
                                rows={3}
                                className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                value={block.address || ''}
                                onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.address`, e.target.value)}
                              />
                            ) : (
                              block.address || '123 Main St, Anytown, USA 12345'
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      case 'contact_form':
      case 'enquiry_form':
        return (
          <React.Fragment key={key}>
            <div className="bg-gray-50 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditing ? (
                      <Input
                        label="Form Title"
                        value={block.headline || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                      />
                    ) : (
                      block.headline || 'Send us a message'
                    )}
                  </h2>

                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      {isEditing ? (
                        <div className="space-y-6">
                          {block.form_fields && block.form_fields.map((field, index) => (
                            <div key={`field-${index}`} className="border border-gray-200 rounded-md p-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                  label="Field Label"
                                  value={field.label || ''}
                                  onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.form_fields.${index}.label`, e.target.value)}
                                />
                                <Input
                                  label="Field Name"
                                  value={field.name || ''}
                                  onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.form_fields.${index}.name`, e.target.value)}
                                />
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                                  <select
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-java-500 focus:border-java-500 sm:text-sm rounded-md"
                                    value={field.type || 'text'}
                                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.form_fields.${index}.type`, e.target.value)}
                                  >
                                    <option value="text">Text</option>
                                    <option value="email">Email</option>
                                    <option value="tel">Telephone</option>
                                    <option value="textarea">Text Area</option>
                                    <option value="select">Select</option>
                                  </select>
                                </div>
                                <Input
                                  label="Placeholder"
                                  value={field.placeholder || ''}
                                  onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.form_fields.${index}.placeholder`, e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                          <Input
                            label="Submit Button Text"
                            value={block.submit_button_text || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.submit_button_text`, e.target.value)}
                          />
                        </div>
                      ) : (
                        <form className="space-y-6">
                          {block.form_fields && block.form_fields.map((field, index) => (
                            <div key={`field-${index}`}>
                              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                                {field.label}
                              </label>
                              <div className="mt-1">
                                {field.type === 'textarea' ? (
                                  <textarea
                                    id={field.name}
                                    name={field.name}
                                    rows={4}
                                    className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder={field.placeholder}
                                  />
                                ) : field.type === 'select' ? (
                                  <select
                                    id={field.name}
                                    name={field.name}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-java-500 focus:border-java-500 sm:text-sm rounded-md"
                                  >
                                    <option>Select an option</option>
                                  </select>
                                ) : (
                                  <input
                                    type={field.type}
                                    name={field.name}
                                    id={field.name}
                                    className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder={field.placeholder}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                          <div>
                            <button
                              type="submit"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-java-600 hover:bg-java-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-java-500"
                            >
                              {block.submit_button_text || 'Send Message'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      case 'map_section':
      case 'social_links_row':
        return (
          <React.Fragment key={key}>
            <div className="bg-white py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditing ? (
                      <Input
                        label="Map Title"
                        value={block.headline || ''}
                        onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.headline`, e.target.value)}
                      />
                    ) : (
                      block.headline || 'Find Us'
                    )}
                  </h2>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Embed Link or iFrame Code</label>
                        <textarea
                          rows={4}
                          className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={block.embed_link || block.iframe_code || ''}
                          onChange={(e) => {
                            if (block.embed_link) {
                              handleNestedFormChange(`blocks.${blockIndex}.embed_link`, e.target.value);
                            } else {
                              handleNestedFormChange(`blocks.${blockIndex}.iframe_code`, e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                      {block.embed_link ? (
                        <iframe
                          src={block.embed_link}
                          width="100%"
                          height="450"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Map"
                        ></iframe>
                      ) : block.iframe_code ? (
                        <div dangerouslySetInnerHTML={{ __html: block.iframe_code }} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Map will be displayed here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        );

      default:
        return null;
    }
  });
};

/**
 * Renders blocks for the Footer
 * @param {Array} blocks - Array of block objects
 * @param {Boolean} isEditing - Whether the page is in edit mode
 * @param {Function} handleNestedFormChange - Function to handle form changes
 * @param {Object} brand_info - Brand information object
 * @returns {JSX.Element} Rendered blocks
 */
export const renderFooterBlocks = (blocks, isEditing, handleNestedFormChange, brand_info) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks.map((block, blockIndex) => {
    if (!block || !block.blockType) return null;

    const key = `footer-block-${blockIndex}-${block.blockType}`;

    switch (block.blockType) {
      case 'footer_links':
        return (
          <React.Fragment key={key}>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {isEditing ? (
                <div className="col-span-2 md:col-span-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-2">Footer Links</h3>
                  <div className="space-y-4">
                    {block.links && block.links.map((link, index) => (
                      <div key={`link-${index}`} className="border border-gray-200 rounded-md p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="Link Text"
                            value={link.link_text || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.links.${index}.link_text`, e.target.value)}
                          />
                          <Input
                            label="URL"
                            value={link.url || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.links.${index}.url`, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {block.links && block.links.map((link, index) => (
                    <div key={`link-${index}`}>
                      <a href={link.url || '#'} className="text-base text-gray-300 hover:text-white">
                        {link.link_text}
                      </a>
                    </div>
                  ))}
                </>
              )}
            </div>
          </React.Fragment>
        );

      case 'social_icons':
        return (
          <React.Fragment key={key}>
            <div className="mt-8 flex space-x-6">
              {isEditing ? (
                <div className="w-full">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-2">Social Media</h3>
                  <div className="space-y-4">
                    {block.icons && block.icons.map((social, index) => (
                      <div key={`social-${index}`} className="border border-gray-200 rounded-md p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="Icon"
                            value={social.icon || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.icons.${index}.icon`, e.target.value)}
                          />
                          <Input
                            label="Link"
                            value={social.link || ''}
                            onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.icons.${index}.link`, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {block.icons && block.icons.map((social, index) => (
                    <a key={`social-${index}`} href={social.link || '#'} className="text-gray-400 hover:text-gray-300">
                      <span className="sr-only">{social.icon}</span>
                      <i className={`fab fa-${social.icon} h-6 w-6`} aria-hidden="true"></i>
                    </a>
                  ))}
                </>
              )}
            </div>
          </React.Fragment>
        );

      case 'newsletter':
        return (
          <React.Fragment key={key}>
            <div className="mt-8">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="Newsletter Title"
                    value={block.title || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.title`, e.target.value)}
                  />
                  <Input
                    label="Input Placeholder"
                    value={block.input_placeholder || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.input_placeholder`, e.target.value)}
                  />
                  <Input
                    label="Button Text"
                    value={block.button_text || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.button_text`, e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    {block.title || 'Subscribe to our newsletter'}
                  </h3>
                  <p className="mt-4 text-base text-gray-300">
                    The latest news, articles, and resources, sent to your inbox weekly.
                  </p>
                  <form className="mt-4 sm:flex sm:max-w-md">
                    <label htmlFor="email-address" className="sr-only">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email-address"
                      id="email-address"
                      autoComplete="email"
                      required
                      className="appearance-none min-w-0 w-full bg-white border border-transparent rounded-md py-2 px-4 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white focus:border-white focus:placeholder-gray-400"
                      placeholder={block.input_placeholder || 'Enter your email'}
                    />
                    <div className="mt-3 rounded-md sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                      <button
                        type="submit"
                        className="w-full bg-java-500 border border-transparent rounded-md py-2 px-4 flex items-center justify-center text-base font-medium text-white hover:bg-java-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-java-500"
                      >
                        {block.button_text || 'Subscribe'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </React.Fragment>
        );

      case 'brand_info':
        return (
          <React.Fragment key={key}>
            <div className="mb-8">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="Brand Name"
                    value={block.name || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.name`, e.target.value)}
                  />
                  <Input
                    label="Brand Description"
                    value={block.description || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.description`, e.target.value)}
                  />
                  <Input
                    label="Logo URL"
                    value={block.logo_url || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.logo_url`, e.target.value)}
                  />
                  <Input
                    label="Logo Alt Text"
                    value={block.logo_alt || ''}
                    onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.logo_alt`, e.target.value)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-start">
                  {(block.logo_url || (brand_info && brand_info.logo_url)) && (
                    <img 
                      src={block.logo_url || (brand_info && brand_info.logo_url)} 
                      alt={block.logo_alt || (brand_info && brand_info.logo_alt) || 'Company Logo'} 
                      className="h-12 mb-4"
                    />
                  )}
                  <h3 className="text-xl font-logo mb-2">{block.name || (brand_info && brand_info.name) || 'Company Name'}</h3>
                  <p className="text-gray-300 mb-4">
                    {block.description || (brand_info && brand_info.description) || 'Company description goes here.'}
                  </p>
                </div>
              )}
            </div>
          </React.Fragment>
        );

      case 'footer_note':
        return (
          <React.Fragment key={key}>
            <div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
              <div className="flex space-x-6 md:order-2">
                {isEditing ? (
                  <div className="w-full">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Footer Text</label>
                        <textarea
                          rows={3}
                          className="shadow-sm focus:ring-java-500 focus:border-java-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-700 text-white"
                          value={block.text || ''}
                          onChange={(e) => handleNestedFormChange(`blocks.${blockIndex}.text`, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-base text-gray-400">
                    {block.text || (brand_info && brand_info.copyright_text) || `© ${new Date().getFullYear()} Your Company, Inc. All rights reserved.`}
                  </p>
                )}
              </div>
            </div>
          </React.Fragment>
        );

      default:
        return null;
    }
  });
};